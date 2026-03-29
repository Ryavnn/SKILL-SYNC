"""
Profile Service — Manages freelancer profile lookups and credential persistence.
Used by UploadController and ProfileRoutes.
"""

from app import db
from models.freelancer import FreelancerProfile, Credential


class ProfileService:
    """Thin service layer for profile-related operations needed by uploads."""

    @staticmethod
    def get_freelancer_by_user_id(user_id):
        """Find a FreelancerProfile by associated user_id."""
        return FreelancerProfile.query.filter_by(user_id=user_id).first()

    @staticmethod
    def create_credential(freelancer_id, document_url):
        """Persist a credential record pointing to the uploaded file."""
        credential = Credential(
            freelancer_id=freelancer_id,
            document_url=document_url,
            status='unverified'
        )
        db.session.add(credential)
        db.session.commit()
        return credential

    @staticmethod
    def get_credentials(freelancer_id):
        """Get all credentials for a freelancer."""
        return Credential.query.filter_by(freelancer_id=freelancer_id).all()
