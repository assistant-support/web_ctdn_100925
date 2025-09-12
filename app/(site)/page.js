// app/page.jsx
import Hero from '@/components/Hero'
import ObjectivesSection from '@/components/sections/ObjectivesSection'
import TimelineSection from '@/components/sections/TimelineSection'
import RulesSection from '@/components/sections/RulesSection'
import PrizesSection from '@/components/sections/PrizesSection'
import FAQSection from '@/components/sections/FAQSection'

export default function Page() {
  return (
    <>
      <Hero />
      <ObjectivesSection />
      <TimelineSection />
      <RulesSection />
      <PrizesSection />
      <FAQSection />
    </>
  )
}
