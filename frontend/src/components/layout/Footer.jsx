import { Github, Twitter, Linkedin, Zap } from "lucide-react"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[var(--background)] border-t border-[var(--border)] pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center">
                <Zap className="fill-white text-white w-4 h-4" />
              </div>
              <span className="font-extrabold text-xl tracking-tight">SkillSync</span>
            </div>
            <p className="text-[var(--muted-foreground)] text-sm max-w-xs leading-relaxed">
              Elevating the IT freelance marketplace with AI-powered matching and verified expert networks.
            </p>
            <div className="flex items-center gap-4 pt-2 text-[var(--muted-foreground)]">
              <a href="#" className="hover:text-[var(--primary)] transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-[var(--primary)] transition-colors"><Github className="w-5 h-5" /></a>
              <a href="#" className="hover:text-[var(--primary)] transition-colors"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-[var(--foreground)] mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-[var(--muted-foreground)] font-medium">
              <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Job Matching</a></li>
              <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Find Talent</a></li>
              <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Verification</a></li>
              <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Referral Engine</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-[var(--foreground)] mb-6">Resources</h4>
            <ul className="space-y-4 text-sm text-[var(--muted-foreground)] font-medium">
              <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-[var(--primary)] transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Hiring Guide</a></li>
              <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Success Stories</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-[var(--foreground)] mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-[var(--muted-foreground)] font-medium">
              <li><a href="#" className="hover:text-[var(--primary)] transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[var(--primary)] transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[var(--muted-foreground)]">
          <p>© {currentYear} SkillSync IT Ltd. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-[var(--foreground)] transition-colors">Status</a>
            <a href="#" className="hover:text-[var(--foreground)] transition-colors">Cookies</a>
            <a href="#" className="hover:text-[var(--foreground)] transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
