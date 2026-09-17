import { ArrowRight, BookOpenCheck, Building2, CalendarPlus, Users } from "lucide-react";

const steps = [
  { icon: Users, title: "현재 재직자 기준", copy: "입·퇴사와 부서 이동 이력을 반영" },
  { icon: Building2, title: "과정 대상 조건", copy: "부서·직무·직급 조건으로 자동 산정" },
  { icon: BookOpenCheck, title: "수료·미수료 판정", copy: "모든 차수의 유효한 수료 이력을 통합" },
  { icon: CalendarPlus, title: "다음 차수 후보", copy: "현재 대상자 중 미수료자만 추출" },
];

export default function FlowOverview() {
  return (
    <section className="flow-card" aria-labelledby="flow-title">
      <div className="section-heading">
        <div><span className="eyebrow">HOW IT WORKS</span><h2 id="flow-title">교육 대상 산정 흐름</h2></div>
        <span className="demo-chip">기준일 2026.09.17</span>
      </div>
      <div className="flow-grid">
        {steps.map(({ icon: Icon, title, copy }, index) => (
          <div className="flow-step-wrap" key={title}>
            <div className="flow-step">
              <span className="flow-icon"><Icon size={19} /></span>
              <div><strong>{title}</strong><p>{copy}</p></div>
            </div>
            {index < steps.length - 1 && <ArrowRight className="flow-arrow" size={18} aria-hidden />}
          </div>
        ))}
      </div>
    </section>
  );
}
