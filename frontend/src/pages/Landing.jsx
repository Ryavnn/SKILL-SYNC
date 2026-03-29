import { motion } from "framer-motion"
import { ArrowRight, Star, CheckCircle2, Zap, Shield, Users } from "lucide-react"
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function Landing() {
  return (
    <div className="flex flex-col w-full">
      {/* ─── Hero Section ─── */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,rgba(99,102,241,0.08)_0%,transparent_100%)]" />
        <div className="container px-4 mx-auto">
          <motion.div 
            className="text-center max-w-4xl mx-auto space-y-8"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.div variants={fadeIn}>
              <Badge variant="secondary" className="px-4 py-1.5 rounded-full border border-indigo-200 bg-indigo-50/50 text-indigo-700 font-bold tracking-tight">
                v2.0 is now live • Just released
              </Badge>
            </motion.div>
            
            <motion.h1 
              variants={fadeIn}
              className="text-5xl lg:text-7xl font-extrabold tracking-tight text-[var(--foreground)] leading-[1.1]"
            >
              The Next Era of <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-500">IT Freelancing</span>
            </motion.h1>
            
            <motion.p 
              variants={fadeIn}
              className="text-xl text-[var(--muted-foreground)] max-w-2xl mx-auto leading-relaxed"
            >
              Connect with verified top 1% developers, manage complex projects with AI-assisted matching, and scale your tech team in days, not months.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" className="h-14 px-8 text-lg font-bold rounded-full group">
                Find Your Specialist
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-bold rounded-full">
                Apply as Freelancer
              </Button>
            </motion.div>

            <motion.div variants={fadeIn} className="flex items-center justify-center gap-8 pt-12 grayscale opacity-50">
              <span className="font-bold flex items-center gap-2"><Zap className="w-5 h-5 fill-current" /> TechFlow</span>
              <span className="font-bold flex items-center gap-2"><Shield className="w-5 h-5 fill-current" /> SecureScale</span>
              <span className="font-bold flex items-center gap-2"><Users className="w-5 h-5 fill-current" /> TeamLink</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── Bento Grid Features ─── */}
      <section className="py-24 bg-[var(--muted)]/30">
        <div className="container px-4 mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight">Built for performance</h2>
            <p className="text-[var(--muted-foreground)] max-w-xl mx-auto">Skip the endless search. Our system handles the vetting so you can focus on building.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px] lg:auto-rows-[300px]">
            {/* Large Feature */}
            <Card className="md:col-span-2 md:row-span-2 group overflow-hidden border-none shadow-xl shadow-indigo-500/5 bg-[var(--card)]">
              <CardContent className="p-8 lg:p-12 h-full flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[var(--primary)]">
                    <Zap className="w-6 h-6 fill-current" />
                  </div>
                  <h3 className="text-3xl font-bold">AI Matching Engine</h3>
                  <p className="text-[var(--muted-foreground)] text-lg max-w-md">Our neural network matches project requirements with freelancer skills, availability, and past performance history in milliseconds.</p>
                </div>
                <div className="relative mt-8 group-hover:scale-105 transition-transform duration-500">
                   <div className="h-32 lg:h-48 w-full bg-gradient-to-br from-indigo-50 to-emerald-50 rounded-2xl border border-indigo-100 flex items-center justify-center">
                      <div className="flex -space-x-4">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-indigo-200" />
                        ))}
                      </div>
                   </div>
                </div>
              </CardContent>
            </Card>

            {/* Small Feature 1 */}
            <Card className="group overflow-hidden border-none shadow-lg shadow-black/5 bg-[var(--card)]">
              <CardContent className="p-8 h-full flex flex-col items-center text-center justify-center gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-[var(--accent)]">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-bold">Guaranteed Payments</h3>
                <p className="text-sm text-[var(--muted-foreground)] px-2">Secure escrow services ensure you only pay for work you approve.</p>
              </CardContent>
            </Card>

            {/* Small Feature 2 */}
            <Card className="group overflow-hidden border-none shadow-lg shadow-black/5 bg-[var(--card)]">
              <CardContent className="p-8 h-full flex flex-col justify-between">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                  <Star className="w-5 h-5" />
                </div>
                <div>
                   <h3 className="text-xl font-bold">1% Expert Bench</h3>
                   <p className="text-sm text-[var(--muted-foreground)]">Vetted for technical and soft skills.</p>
                </div>
              </CardContent>
            </Card>

            {/* Medium Feature */}
            <Card className="md:col-span-1 group overflow-hidden border-none shadow-lg shadow-black/5 bg-[var(--card)]">
               <CardContent className="p-8 h-full flex flex-col justify-between bg-indigo-600 text-white">
                 <h3 className="text-2xl font-bold">Ready to scale your next big idea?</h3>
                 <Button className="w-full bg-white text-indigo-600 hover:bg-white/90">Join Waitlist</Button>
               </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── Social Proof ─── */}
      <section className="py-24">
         <div className="container px-4 mx-auto text-center space-y-12">
            <h2 className="text-xl font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Trusted by Global Teams</h2>
            <div className="flex flex-wrap justify-center gap-12 lg:gap-24 grayscale">
               <span className="text-2xl font-black italic tracking-tighter hover:grayscale-0 transition-all cursor-default">STRIPE</span>
               <span className="text-2xl font-black italic tracking-tighter hover:grayscale-0 transition-all cursor-default">NOTION</span>
               <span className="text-2xl font-black italic tracking-tighter hover:grayscale-0 transition-all cursor-default">VERCEL</span>
               <span className="text-2xl font-black italic tracking-tighter hover:grayscale-0 transition-all cursor-default">LINEAR</span>
            </div>
         </div>
      </section>
    </div>
  )
}
