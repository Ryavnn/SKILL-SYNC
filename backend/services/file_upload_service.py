"""
File Upload Service — Handles file storage for SkillSync.

Supports:
  - Freelancer credential uploads (PDFs, images)
  - Portfolio file uploads
  - Profile avatar uploads

Storage Strategy:
  - Local disk storage for development (configurable upload directory)
  - Designed to be swapped for S3/R2 with a single adapter change

Security:
  - File type validation (whitelist)
  - File size limits
  - Secure filename generation (UUID-based)
"""

import os
import uuid
from datetime import datetime
from werkzeug.utils import secure_filename

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
ALLOWED_EXTENSIONS = {
    'credential': {'pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'},
    'portfolio':  {'pdf', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'zip'},
    'avatar':     {'jpg', 'jpeg', 'png', 'webp'},
}

MAX_FILE_SIZE_MB = 10  # 10 MB limit


class FileUploadService:
    """Handles file validation, storage, and URL generation."""

    def __init__(self, upload_root=None):
        self.upload_root = upload_root or os.environ.get(
            'UPLOAD_DIR',
            os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
        )
        # Ensure upload directories exist
        for subdir in ['credentials', 'portfolio', 'avatars']:
            os.makedirs(os.path.join(self.upload_root, subdir), exist_ok=True)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def save_credential(self, file, freelancer_id):
        """Save a credential document. Returns file URL or error dict."""
        return self._save_file(file, 'credential', 'credentials', str(freelancer_id))

    def save_portfolio_file(self, file, freelancer_id):
        """Save a portfolio attachment. Returns file URL or error dict."""
        return self._save_file(file, 'portfolio', 'portfolio', str(freelancer_id))

    def save_avatar(self, file, user_id):
        """Save a profile avatar. Returns file URL or error dict."""
        return self._save_file(file, 'avatar', 'avatars', str(user_id))

    def delete_file(self, file_url):
        """Delete a file by its URL path."""
        # Convert URL path to absolute path
        relative = file_url.lstrip('/')
        abs_path = os.path.join(self.upload_root, relative)
        if os.path.exists(abs_path):
            os.remove(abs_path)
            return True
        return False

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _save_file(self, file, file_category, subdir, owner_id):
        """
        Validate and save an uploaded file.
        Returns: {"url": "/uploads/...", "filename": "...", "status": 201}
        or:      {"error": "...", "status": 400}
        """
        if not file or file.filename == '':
            return {"error": "No file provided", "status": 400}

        # Validate extension
        original_name = secure_filename(file.filename)
        ext = self._get_extension(original_name)
        allowed = ALLOWED_EXTENSIONS.get(file_category, set())

        if ext not in allowed:
            return {
                "error": f"File type .{ext} not allowed. Accepted: {', '.join(sorted(allowed))}",
                "status": 400
            }

        # Validate size (read content length from stream)
        file.seek(0, os.SEEK_END)
        size_bytes = file.tell()
        file.seek(0)  # Reset for saving

        if size_bytes > MAX_FILE_SIZE_MB * 1024 * 1024:
            return {
                "error": f"File exceeds {MAX_FILE_SIZE_MB}MB limit",
                "status": 400
            }

        # Generate unique filename: <owner_id>_<uuid>.<ext>
        unique_name = f"{owner_id}_{uuid.uuid4().hex[:12]}.{ext}"

        # Save to disk
        dest_dir = os.path.join(self.upload_root, subdir)
        dest_path = os.path.join(dest_dir, unique_name)
        file.save(dest_path)

        # Return URL path (relative to upload root — served via static/reverse proxy)
        url_path = f"/uploads/{subdir}/{unique_name}"

        return {
            "url":       url_path,
            "filename":  original_name,
            "size":      size_bytes,
            "status":    201
        }

    @staticmethod
    def _get_extension(filename):
        """Extract lowercase file extension."""
        if '.' not in filename:
            return ''
        return filename.rsplit('.', 1)[1].lower()
