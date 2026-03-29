from app import create_app, db
from services.analytics_service import AnalyticsService

app = create_app()

with app.app_context():
    service = AnalyticsService()
    print("Forcing analytics update...")
    summary = service.update_analytics()
    print(f"Update complete: Users: {summary.total_users}, Projects: {summary.total_projects}")
    print(f"Revenue: {summary.total_revenue}, Dispute Rate: {summary.dispute_rate}%")
    
    print("Testing GET dashboard overview...")
    result = service.get_dashboard_overview()
    print(f"Dashboard Result: {result}")
