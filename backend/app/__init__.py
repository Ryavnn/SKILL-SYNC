import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config.config import config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

# Ensure models are imported for migrations
from models import *

def create_app(config_name=None):
    if config_name is None:
        config_name = os.environ.get('FLASK_CONFIG', 'default')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app)
    
    # Register Blueprints
    from routes.auth_routes import auth_bp
    from routes.profile_routes import profile_bp
    from routes.ai_routes import ai_bp
    from routes.referral_routes import referral_bp
    from routes.marketplace_routes import marketplace_bp
    from routes.messaging_routes import messaging_bp
    from routes.freelancer_routes import freelancer_bp
    from routes.contract_routes import contract_bp
    from routes.milestone_routes import milestone_bp
    from routes.dispute_routes import dispute_bp
    from routes.user_routes import user_bp
    from routes.project_routes import project_bp
    from routes.admin_routes import admin_bp
    from routes.payment_routes import payment_bp, escrow_bp
    from routes.mpesa_routes import mpesa_bp
    from routes.upload_routes import upload_bp
    from routes.notification_routes import notification_bp
    from routes.proposal_routes import proposal_bp
    from routes.invitation_routes import invitation_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(referral_bp, url_prefix='/api/referral')
    app.register_blueprint(marketplace_bp, url_prefix='/api/marketplace')
    app.register_blueprint(messaging_bp, url_prefix='/api/messages')
    app.register_blueprint(freelancer_bp, url_prefix='/api/freelancers')
    app.register_blueprint(contract_bp, url_prefix='/api/contracts')
    app.register_blueprint(milestone_bp, url_prefix='/api/milestones')
    app.register_blueprint(dispute_bp, url_prefix='/api/disputes')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(project_bp, url_prefix='/api/projects')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(payment_bp, url_prefix='/api/payments')
    app.register_blueprint(mpesa_bp, url_prefix='/api/payments/mpesa')
    app.register_blueprint(escrow_bp, url_prefix='/api/escrow')
    app.register_blueprint(upload_bp, url_prefix='/api/uploads')
    app.register_blueprint(notification_bp, url_prefix='/api/notifications')
    app.register_blueprint(proposal_bp, url_prefix='/api/proposals')
    app.register_blueprint(invitation_bp, url_prefix='/api/invitations')

    
    # Serve uploaded files in development
    upload_dir = os.path.join(os.path.dirname(__file__), '..', 'uploads')
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir, exist_ok=True)
    
    from flask import send_from_directory
    
    @app.route('/uploads/<path:filename>')
    def serve_upload(filename):
        return send_from_directory(upload_dir, filename)
    
    return app
