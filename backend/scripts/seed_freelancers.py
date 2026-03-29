"""
Seed script to populate the database with test freelancers
Usage: python seed_freelancers.py
"""

from app import create_app, db
from models.user import User
from models.freelancer import FreelancerProfile, Skill
from werkzeug.security import generate_password_hash
import uuid

app = create_app()

with app.app_context():
    print("Starting seed process...")
    
    # Create skills first
    skills_data = ['React', 'Node.js', 'Python', 'Go', 'TypeScript', 
                   'PostgreSQL', 'AWS', 'Figma', 'TailwindCSS', 'Next.js',
                   'Django', 'Flask', 'Vue.js', 'Angular', 'MongoDB',
                   'Docker', 'Kubernetes', 'GraphQL', 'REST API', 'Git']
    
    print("\nCreating skills...")
    created_skills = 0
    for skill_name in skills_data:
        skill = Skill.query.filter_by(name=skill_name).first()
        if not skill:
            skill = Skill(name=skill_name)
            db.session.add(skill)
            created_skills += 1
    
    db.session.commit()
    print(f"✓ Created {created_skills} new skills (Total: {len(skills_data)} skills available)")
    
    # Create test freelancers
    freelancers_data = [
        {
            'name': 'Jane Smith',
            'email': 'jane.smith@skillsync.test',
            'title': 'Senior Full Stack Developer',
            'bio': 'Passionate full-stack developer with 8+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud infrastructure. Have worked with Fortune 500 companies and startups alike.',
            'experience_level': 'senior',
            'hourly_rate': 5000,
            'location': 'Nairobi, Kenya',
            'portfolio_links': ['https://janesmith.dev', 'https://github.com/janesmith'],
            'skills': ['React', 'Node.js', 'PostgreSQL', 'AWS', 'TypeScript', 'Docker']
        },
        {
            'name': 'John Kamau',
            'email': 'john.kamau@skillsync.test',
            'title': 'UI/UX Designer & Frontend Developer',
            'bio': 'Creative designer focused on user-centered design and modern interfaces. 5 years of experience creating beautiful, functional web applications. Expert in design systems and component libraries.',
            'experience_level': 'mid',
            'hourly_rate': 3500,
            'location': 'Mombasa, Kenya',
            'portfolio_links': ['https://dribbble.com/johnkamau', 'https://johnkamau.design'],
            'skills': ['Figma', 'React', 'TailwindCSS', 'TypeScript', 'Next.js']
        },
        {
            'name': 'Mary Njeri',
            'email': 'mary.njeri@skillsync.test',
            'title': 'Backend Engineer & DevOps Specialist',
            'bio': 'Specialized in building robust APIs and microservices architecture. 7 years of experience with Python, Go, and cloud infrastructure. Strong focus on scalability and performance optimization.',
            'experience_level': 'senior',
            'hourly_rate': 4500,
            'location': 'Nairobi, Kenya',
            'portfolio_links': ['https://github.com/marynjeri', 'https://marynjeri.tech'],
            'skills': ['Python', 'Go', 'PostgreSQL', 'AWS', 'Docker', 'Kubernetes', 'Django']
        },
        {
            'name': 'Peter Ochieng',
            'email': 'peter.ochieng@skillsync.test',
            'title': 'Junior React Developer',
            'bio': 'Enthusiastic junior developer eager to build modern web applications. Fresh graduate with 1 year of professional experience. Quick learner and team player with strong fundamentals.',
            'experience_level': 'junior',
            'hourly_rate': 2000,
            'location': 'Kisumu, Kenya',
            'portfolio_links': ['https://github.com/peterochieng'],
            'skills': ['React', 'TypeScript', 'TailwindCSS', 'Git', 'REST API']
        },
        {
            'name': 'Sarah Wanjiku',
            'email': 'sarah.wanjiku@skillsync.test',
            'title': 'DevOps Engineer & Cloud Architect',
            'bio': 'Expert in cloud infrastructure and CI/CD pipelines with 10+ years of experience. AWS Certified Solutions Architect. Specialized in automation, monitoring, and infrastructure as code.',
            'experience_level': 'expert',
            'hourly_rate': 6000,
            'location': 'Nairobi, Kenya',
            'portfolio_links': ['https://sarahwanjiku.dev', 'https://linkedin.com/in/sarahwanjiku'],
            'skills': ['AWS', 'Kubernetes', 'Docker', 'Python', 'Node.js', 'PostgreSQL', 'MongoDB']
        },
        {
            'name': 'David Mwangi',
            'email': 'david.mwangi@skillsync.test',
            'title': 'Mobile App Developer',
            'bio': 'Cross-platform mobile developer specializing in React Native. 4 years of experience building high-performance mobile applications for iOS and Android.',
            'experience_level': 'mid',
            'hourly_rate': 3800,
            'location': 'Nakuru, Kenya',
            'portfolio_links': ['https://davidmwangi.dev'],
            'skills': ['React', 'React Native', 'TypeScript', 'Node.js', 'MongoDB', 'Firebase']
        },
        {
            'name': 'Grace Akinyi',
            'email': 'grace.akinyi@skillsync.test',
            'title': 'Data Engineer',
            'bio': 'Data engineer with expertise in building data pipelines and analytics platforms. 6 years of experience with Python, SQL, and big data technologies.',
            'experience_level': 'senior',
            'hourly_rate': 4800,
            'location': 'Nairobi, Kenya',
            'portfolio_links': ['https://github.com/graceakinyi'],
            'skills': ['Python', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker']
        },
        {
            'name': 'Kevin Omondi',
            'email': 'kevin.omondi@skillsync.test',
            'title': 'Frontend Developer',
            'bio': 'Frontend specialist with a passion for creating beautiful, responsive user interfaces. 3 years of experience with modern JavaScript frameworks.',
            'experience_level': 'mid',
            'hourly_rate': 3200,
            'location': 'Eldoret, Kenya',
            'portfolio_links': ['https://kevinomondi.com'],
            'skills': ['React', 'Vue.js', 'TypeScript', 'TailwindCSS', 'Next.js', 'GraphQL']
        }
    ]
    
    print("\nCreating freelancer profiles...")
    created_count = 0
    skipped_count = 0
    
    for data in freelancers_data:
        # Check if user exists
        user = User.query.filter_by(email=data['email']).first()
        
        if user:
            print(f"  ⊘ Skipped: {data['name']} (already exists)")
            skipped_count += 1
            continue
        
        # Create user
        user = User(
            id=str(uuid.uuid4()),
            email=data['email'],
            password_hash=generate_password_hash('Password123!'),
            name=data['name'],
            role='freelancer'
        )
        db.session.add(user)
        db.session.flush()
        
        # Create freelancer profile
        profile = FreelancerProfile(
            id=uuid.uuid4(),
            user_id=user.id,
            title=data['title'],
            bio=data['bio'],
            experience_level=data['experience_level'],
            hourly_rate=data['hourly_rate'],
            location=data['location'],
            portfolio_links=data.get('portfolio_links', []),
            verification_status='verified'  # Auto-verify for testing
        )
        
        # Add skills to profile
        for skill_name in data['skills']:
            skill = Skill.query.filter_by(name=skill_name).first()
            if skill:
                profile.skills.append(skill)
        
        db.session.add(profile)
        created_count += 1
        print(f"  ✓ Created: {data['name']} ({data['title']})")
    
    db.session.commit()
    
    print("\n" + "="*60)
    print(f"Seed completed successfully!")
    print(f"  • Created: {created_count} freelancers")
    print(f"  • Skipped: {skipped_count} freelancers (already existed)")
    print(f"  • Total freelancers in DB: {FreelancerProfile.query.count()}")
    print("\nTest Login Credentials:")
    print("  Email: any of the above emails")
    print("  Password: Password123!")
    print("="*60)
