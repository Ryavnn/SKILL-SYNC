from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services.file_upload_service import FileUploadService
from services.profile_service import ProfileService


class UploadController:
    """Handles file upload endpoints for credentials, portfolio, and avatars."""

    def __init__(self):
        self.upload_service = FileUploadService()
        self.profile_service = ProfileService()

    @jwt_required()
    def upload_credential(self):
        """Upload a credential document for the current freelancer."""
        user_id = get_jwt_identity()

        if 'file' not in request.files:
            return jsonify({
                "status": "error",
                "message": "No file part in request"
            }), 400

        file = request.files['file']

        # Resolve freelancer profile for this user
        freelancer = self.profile_service.get_freelancer_by_user_id(str(user_id))
        if not freelancer:
            return jsonify({
                "status": "error",
                "message": "Freelancer profile not found. Create a profile first."
            }), 404

        result = self.upload_service.save_credential(file, freelancer.id)

        if "error" in result:
            return jsonify({
                "status": "error",
                "message": result["error"]
            }), result.get("status", 400)

        # Persist credential record in database
        credential = self.profile_service.create_credential(
            freelancer_id=str(freelancer.id),
            document_url=result["url"]
        )

        return jsonify({
            "status": "success",
            "data": {
                "credential_id": str(credential.id) if credential else None,
                "url": result["url"],
                "filename": result["filename"],
                "size": result["size"]
            },
            "message": "Credential uploaded successfully"
        }), 201

    @jwt_required()
    def upload_portfolio(self):
        """Upload a portfolio file for the current freelancer."""
        user_id = get_jwt_identity()

        if 'file' not in request.files:
            return jsonify({
                "status": "error",
                "message": "No file part in request"
            }), 400

        file = request.files['file']

        freelancer = self.profile_service.get_freelancer_by_user_id(str(user_id))
        if not freelancer:
            return jsonify({
                "status": "error",
                "message": "Freelancer profile not found"
            }), 404

        result = self.upload_service.save_portfolio_file(file, freelancer.id)

        if "error" in result:
            return jsonify({
                "status": "error",
                "message": result["error"]
            }), result.get("status", 400)

        return jsonify({
            "status": "success",
            "data": {
                "url": result["url"],
                "filename": result["filename"],
                "size": result["size"]
            },
            "message": "Portfolio file uploaded successfully"
        }), 201

    @jwt_required()
    def upload_avatar(self):
        """Upload a profile avatar."""
        user_id = get_jwt_identity()

        if 'file' not in request.files:
            return jsonify({
                "status": "error",
                "message": "No file part in request"
            }), 400

        file = request.files['file']
        result = self.upload_service.save_avatar(file, str(user_id))

        if "error" in result:
            return jsonify({
                "status": "error",
                "message": result["error"]
            }), result.get("status", 400)

        return jsonify({
            "status": "success",
            "data": {
                "url": result["url"],
                "filename": result["filename"],
                "size": result["size"]
            },
            "message": "Avatar uploaded successfully"
        }), 201
