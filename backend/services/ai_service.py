"""
AI Matching Service — Production-Grade Freelancer-Project Matching Engine.

Scoring dimensions:
  1. Skill Match        (40%) — Jaccard overlap between project required_skills and freelancer skills
  2. Experience Level   (15%) — Weighted mapping against project complexity inferred from budget
  3. Budget Compat.     (15%) — How well freelancer hourly_rate fits within project budget range
  4. Verification Boost (10%) — Verified freelancers get full score
  5. Keyword / Bio      (10%) — NLP-lite keyword overlap between project description and freelancer bio
  6. Availability       (10%) — Freelancers not currently assigned to active projects score higher

All scores are normalised to [0, 1] then combined with weights.
Final score is presented as an integer 0–100.
"""

import re
from decimal import Decimal
from repositories.matching_repository import MatchingRepository
from models.project import Project
from models.contract import Contract

# ---------------------------------------------------------------------------
# Weight Configuration — easy to tune without touching logic
# ---------------------------------------------------------------------------
WEIGHTS = {
    "skill":        0.40,
    "experience":   0.15,
    "budget":       0.15,
    "verification": 0.10,
    "keyword":      0.10,
    "availability": 0.10,
}


class AIService:
    """Stateless service that scores and ranks freelancers for a given project."""

    def __init__(self):
        self.repository = MatchingRepository()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def match_freelancers_for_project(self, project_id):
        """
        Given a project ID, return a ranked list of freelancer match objects.
        Returns None if project not found.
        """
        project = self.repository.get_project_with_skills(project_id)
        if not project:
            return None

        freelancers = self.repository.get_all_freelancers_with_skills()
        if not freelancers:
            return []

        # Pre-compute project-level data once
        project_ctx = self._build_project_context(project)

        scored = []
        for freelancer in freelancers:
            # Skip freelancers whose user account is inactive
            if not freelancer.user.is_active:
                continue

            result = self._score_freelancer(project, project_ctx, freelancer)
            scored.append(result)

        # Rank descending by score
        scored.sort(key=lambda x: x["score"], reverse=True)

        # Only return freelancers with a minimum relevance (score > 0)
        return [s for s in scored if s["score"] > 0]

    def match_freelancers_by_description(self, description, skills=None, budget_min=None, budget_max=None):
        """
        Ad-hoc matching without a persisted project.
        Builds a lightweight project context from raw inputs.
        """
        freelancers = self.repository.get_all_freelancers_with_skills()
        if not freelancers:
            return []

        # Build a pseudo-project context
        skill_names = set(s.lower() for s in (skills or []))
        desc_keywords = set(re.findall(r'\b\w{4,}\b', description.lower())) if description else set()

        project_ctx = {
            "skill_names":    skill_names,
            "desc_keywords":  desc_keywords,
            "budget_min":     float(budget_min) if budget_min else None,
            "budget_max":     float(budget_max) if budget_max else None,
        }

        # Build a mock project object with needed attrs
        class _MockProject:
            pass

        mock = _MockProject()
        mock.description = description or ""
        mock.budget_min = budget_min
        mock.budget_max = budget_max
        mock.required_skills = []

        scored = []
        for freelancer in freelancers:
            if not freelancer.user.is_active:
                continue
            result = self._score_freelancer(mock, project_ctx, freelancer)
            scored.append(result)

        scored.sort(key=lambda x: x["score"], reverse=True)
        return [s for s in scored if s["score"] > 0]

    # ------------------------------------------------------------------
    # Internal scoring
    # ------------------------------------------------------------------

    def _build_project_context(self, project):
        """Pre-compute reusable data from a Project ORM object."""
        skill_names = {s.name.lower() for s in project.required_skills}
        desc_keywords = set(re.findall(r'\b\w{4,}\b', project.description.lower())) if project.description else set()
        budget_min = float(project.budget_min) if project.budget_min else None
        budget_max = float(project.budget_max) if project.budget_max else None

        return {
            "skill_names":   skill_names,
            "desc_keywords": desc_keywords,
            "budget_min":    budget_min,
            "budget_max":    budget_max,
        }

    def _score_freelancer(self, project, project_ctx, freelancer):
        """Score a single freelancer against a project context."""

        scores = {
            "skill":        self._skill_score(project_ctx, freelancer),
            "experience":   self._experience_score(project_ctx, freelancer),
            "budget":       self._budget_score(project_ctx, freelancer),
            "verification": self._verification_score(freelancer),
            "keyword":      self._keyword_score(project_ctx, freelancer),
            "availability": self._availability_score(freelancer),
        }

        # Weighted sum
        final = sum(scores[k] * WEIGHTS[k] for k in WEIGHTS)
        # Convert to 0–100 integer
        final_pct = round(final * 100)

        # Gather skill details
        fl_skills = {s.name.lower() for s in freelancer.skills}
        matched = list(project_ctx["skill_names"] & fl_skills)
        missing = list(project_ctx["skill_names"] - fl_skills)

        return {
            "freelancer": {
                "id":                 str(freelancer.id),
                "user_id":            str(freelancer.user_id),
                "name":               freelancer.user.name,
                "title":              freelancer.title,
                "bio":                freelancer.bio,
                "experience_level":   freelancer.experience_level,
                "hourly_rate":        str(freelancer.hourly_rate) if freelancer.hourly_rate else None,
                "is_verified":        freelancer.verification_status == 'verified',
                "skills":             [s.name for s in freelancer.skills],
            },
            "score":            final_pct,
            "matched_skills":   matched,
            "missing_skills":   missing,
            "score_breakdown":  {k: round(v * 100) for k, v in scores.items()},
        }

    # ------------------------------------------------------------------
    # Individual scoring functions (each returns 0.0 – 1.0)
    # ------------------------------------------------------------------

    @staticmethod
    def _skill_score(ctx, freelancer):
        """Jaccard-style skill overlap."""
        required = ctx["skill_names"]
        if not required:
            return 0.5  # No skills specified → neutral

        fl_skills = {s.name.lower() for s in freelancer.skills}
        if not fl_skills:
            return 0.0

        matched = required & fl_skills
        return len(matched) / len(required)

    @staticmethod
    def _experience_score(ctx, freelancer):
        """
        Map experience level to a score.
        If budget data is available, prefer senior for high-budget projects.
        """
        exp_map = {'junior': 0.33, 'mid': 0.66, 'senior': 1.0}
        level = (freelancer.experience_level or '').lower()
        base = exp_map.get(level, 0.5)

        # Budget-aware adjustment: high-budget projects favour seniors
        budget_max = ctx.get("budget_max")
        if budget_max and budget_max > 5000 and level == 'senior':
            return min(base * 1.2, 1.0)  # Small boost
        return base

    @staticmethod
    def _budget_score(ctx, freelancer):
        """How well the freelancer's hourly_rate fits within the project budget."""
        rate = freelancer.hourly_rate
        if rate is None:
            return 0.5  # Unknown rate → neutral

        rate = float(rate)
        bmin = ctx.get("budget_min")
        bmax = ctx.get("budget_max")

        if bmin is None and bmax is None:
            return 0.5  # No budget constraints → neutral

        # If both defined, check if rate falls within range (roughly)
        if bmin is not None and bmax is not None:
            if bmin <= rate <= bmax:
                return 1.0
            elif rate < bmin:
                return max(0.0, 1.0 - (bmin - rate) / bmin)
            else:
                return max(0.0, 1.0 - (rate - bmax) / bmax)

        if bmax is not None:
            return 1.0 if rate <= bmax else max(0.0, 1.0 - (rate - bmax) / bmax)

        if bmin is not None:
            return 1.0 if rate >= bmin else max(0.0, 1.0 - (bmin - rate) / bmin)

        return 0.5

    @staticmethod
    def _verification_score(freelancer):
        return 1.0 if freelancer.verification_status == 'verified' else 0.0

    @staticmethod
    def _keyword_score(ctx, freelancer):
        """Keyword overlap between project description and freelancer bio."""
        desc_keywords = ctx.get("desc_keywords", set())
        if not desc_keywords or not freelancer.bio:
            return 0.0

        bio_lower = freelancer.bio.lower()
        hits = sum(1 for kw in desc_keywords if kw in bio_lower)
        # Normalise: cap at 8 keyword hits for a perfect score
        return min(hits / 8, 1.0)

    @staticmethod
    def _availability_score(freelancer):
        """
        Freelancers not currently assigned to an active contract score higher.
        Uses a simple heuristic: count active contracts.
        """
        active_contracts = Contract.query.filter(
            Contract.freelancer_id == freelancer.user_id,
            Contract.status.in_(['active', 'pending_acceptance'])
        ).count()

        if active_contracts == 0:
            return 1.0
        elif active_contracts == 1:
            return 0.6
        elif active_contracts == 2:
            return 0.3
        else:
            return 0.1
