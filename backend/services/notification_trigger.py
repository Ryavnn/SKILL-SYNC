from services.notification_service import NotificationService
from models.project import Project

notif_service = NotificationService()

## Referral Notifications

def trigger_referral_created(referral):
    # Notify the referred freelancer
    message = f"You have been referred for project '{referral.project.title if referral.project else referral.project_id}'"
    notif_service.create_notification(referral.referred_freelancer_id, 'referral', message)
    
    # Notify the project client
    client_id = referral.project.client_id if referral.project else None
    if client_id:
        req_msg = f"A freelancer has been referred to your project '{referral.project.title if referral.project else referral.project_id}'"
        notif_service.create_notification(client_id, 'referral', req_msg)

def trigger_referral_accepted(referral):
    # Notify referrer
    message = f"Your referral for project '{referral.project.title if referral.project else referral.project_id}' was accepted!"
    notif_service.create_notification(referral.referrer_id, 'referral', message)
    
    # Notify client
    client_id = referral.project.client_id if referral.project else None
    if client_id:
        req_msg = f"The referred freelancer has accepted the invitation for project '{referral.project.title if referral.project else referral.project_id}'"
        notif_service.create_notification(client_id, 'referral', req_msg)

def trigger_referral_rejected(referral):
    # Notify referrer
    message = f"Your referral for project '{referral.project.title if referral.project else referral.project_id}' was declined."
    notif_service.create_notification(referral.referrer_id, 'referral', message)


## Contract Notifications

def trigger_contract_created(contract):
    # Notify freelancer
    notif_service.create_notification(contract.freelancer_id, 'contract', "You have received a new contract offer.")

def trigger_contract_accepted(contract):
    # Notify client
    notif_service.create_notification(contract.client_id, 'contract', "Your contract offer was accepted by the freelancer.")


## Milestone Notifications

def trigger_milestone_funded(milestone, contract):
    # Notify freelancer
    message = f"Milestone '{milestone.title}' has been funded. You can begin work."
    notif_service.create_notification(contract.freelancer_id, 'milestone', message)

def trigger_milestone_submitted(milestone, contract):
    # Notify client
    message = f"Work has been submitted for milestone '{milestone.title}'. Please review."
    notif_service.create_notification(contract.client_id, 'milestone', message)

def trigger_milestone_approved(milestone, contract):
    # Notify freelancer
    message = f"Your work for milestone '{milestone.title}' has been approved."
    notif_service.create_notification(contract.freelancer_id, 'milestone', message)


## Payment Notifications

def trigger_payment_released(milestone, contract):
    # Notify freelancer
    message = f"Payment of ${milestone.amount} has been released for milestone '{milestone.title}'."
    notif_service.create_notification(contract.freelancer_id, 'payment', message)


## Dispute Notifications

def trigger_dispute_created(dispute, contract):
    # Notify client and freelancer
    message = f"A dispute has been opened for milestone #{dispute.milestone_id}."
    notif_service.create_notification(contract.client_id, 'dispute', message)
    notif_service.create_notification(contract.freelancer_id, 'dispute', message)

def trigger_dispute_resolved(dispute, contract):
    # Notify client and freelancer
    message = f"The dispute for milestone #{dispute.milestone_id} has been resolved: {dispute.resolution_type}."
    notif_service.create_notification(contract.client_id, 'dispute', message)
    notif_service.create_notification(contract.freelancer_id, 'dispute', message)


## Admin & Moderation Notifications

def trigger_user_deactivated(user, admin):
    # Typically sent via email since user is deactivated, but we can log a system notice
    notif_service.create_notification(user.id, 'system', "Your account has been deactivated by an admin.")

def trigger_project_flagged(project, admin):
    # Notify project owner
    notif_service.create_notification(project.client_id, 'system', f"Your project '{project.title}' has been flagged by moderation.")

def trigger_project_removed(project, admin, reason):
    # Notify project owner
    notif_service.create_notification(project.client_id, 'system', f"Your project '{project.title}' has been removed by moderation. Reason: {reason}")

def trigger_freelancer_verified(profile, admin):
    # Notify freelancer
    notif_service.create_notification(profile.user_id, 'system', "Your freelancer profile has been verified!")

