from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.referral_service import ReferralService
from schemas.referral_schema import (
    ReferralCreateSchema,
    ReferralResponseSchema,
    ReferralStatsSchema,
    ReferralHistoryItemSchema,
)
from models.user import User

# Base URL used to build referral links — overridable via env in production
REFERRAL_BASE_URL = 'https://skillsync.io/ref'

class ReferralController:
    def __init__(self):
        self.referral_service = ReferralService()
        self.create_schema = ReferralCreateSchema()
        self.response_schema = ReferralResponseSchema()
        self.stats_schema = ReferralStatsSchema()
        self.history_schema = ReferralHistoryItemSchema()

    @jwt_required()
    def create_referral(self):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or user.role != 'freelancer':
            return {"error": "Only freelancers can create referrals", "status": 403}, 403
            
        json_data = request.get_json()
        errors = self.create_schema.validate(json_data)
        if errors:
            return {"error": errors, "status": 400}, 400
            
        result = self.referral_service.create_referral(
            project_id=json_data['project_id'],
            referrer_id=user_id,
            referred_freelancer_id=json_data['referred_freelancer_id'],
            message=json_data.get('message')
        )
        
        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]
            
        return {
            "data": self.response_schema.dump(result["data"]),
            "status": 201
        }, 201

    # ── New: Dashboard endpoints ──────────────────────────────────────────────

    @jwt_required()
    def get_my_referral(self):
        """Return the current freelancer's referral link/code."""
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return {"error": "User not found", "status": 404}, 404

        # Derive a short code from the first 8 chars of the UUID
        referral_code = str(user_id).replace('-', '')[:8]
        referral_link = f"{REFERRAL_BASE_URL}/{referral_code}"

        return {
            "data": {
                "referral_code": referral_code,
                "referral_link": referral_link,
            },
            "status": 200
        }, 200

    @jwt_required()
    def get_referral_stats(self):
        """Return aggregated referral statistics for the current user."""
        user_id = get_jwt_identity()
        result = self.referral_service.get_referral_stats(user_id)
        return {
            "data": self.stats_schema.dump(result["data"]),
            "status": 200
        }, 200

    @jwt_required()
    def get_referral_history(self):
        """Return enriched outgoing referral history for the current user."""
        user_id = get_jwt_identity()
        result = self.referral_service.get_referral_history_enriched(user_id)
        return {
            "data": self.history_schema.dump(result["data"], many=True),
            "status": 200
        }, 200

    # ── Existing CRUD endpoints ───────────────────────────────────────────────

    @jwt_required()
    def get_referrals(self):
        user_id = get_jwt_identity()
        r_type = request.args.get('type', 'incoming')  # incoming or outgoing

        if r_type not in ['incoming', 'outgoing']:
            return {"error": "Invalid type parameter", "status": 400}, 400

        result = self.referral_service.get_user_referrals(user_id, r_type)
        return {
            "data": self.response_schema.dump(result["data"], many=True),
            "status": 200
        }, 200

    @jwt_required()
    def accept_referral(self, id):
        user_id = get_jwt_identity()
        result = self.referral_service.accept_referral(id, user_id)
        
        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]
            
        return {
            "data": self.response_schema.dump(result["data"]),
            "status": 200
        }, 200

    @jwt_required()
    def reject_referral(self, id):
        user_id = get_jwt_identity()
        result = self.referral_service.reject_referral(id, user_id)
        
        if "error" in result:
            return {"error": result["error"], "status": result["status"]}, result["status"]
            
        return {
            "data": self.response_schema.dump(result["data"]),
            "status": 200
        }, 200

    def system_expire_referrals(self):
        # This could be called by a cron job or internal trigger
        result = self.referral_service.expire_referrals()
        return {
            "message": f"Expired {result['count']} referrals",
            "status": 200
        }, 200
