import { Card } from "@/components/ui";

export const metadata = { title: "Help — Vantage MOC" };

export default function HelpPage() {
  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold">MOC Help &amp; Training</h1>

      <Card title="When do we need an MOC?">
        <p className="text-sm">
          Any change that is <strong>not replacement-in-kind</strong> (not
          like-for-like) needs an MOC before the change is made. This covers
          equipment, process conditions, chemicals, controls, procedures, and
          people. If you are unsure, ask Process Safety — starting an MOC and
          being told it isn&apos;t needed is always better than the reverse.
        </p>
      </Card>

      <Card title="Which form do I use?">
        <ul className="text-sm list-disc pl-5 space-y-1.5">
          <li>
            <strong>Equipment / Process Change (MOC)</strong> — physical or
            process modifications. The hazard assessment determines Level 1–4.
          </li>
          <li>
            <strong>Safety System Bypass / Impairment</strong> — temporarily
            defeating a safety device (interlock, relief, detector, fire
            protection). Requires an alternate protection plan; extensions over
            72 hours need Production Manager, Technical Authority, and EHSS
            Manager approval.
          </li>
          <li>
            <strong>Management of Organizational Change (MOOC)</strong> — a
            departure, transfer, or role change that affects who is responsible
            for safe and compliant operation.
          </li>
          <li>
            <strong>Addendum</strong> — a scoped adjustment to an already
            approved MOC; added from the MOC record and approved by the
            Technical Authority.
          </li>
        </ul>
      </Card>

      <Card title="Types: permanent vs. temporary">
        <p className="text-sm">
          A <strong>temporary</strong> change must have an end date. If the
          plant/system is not restored by that date, the change must be
          reviewed and may be extended at most <strong>3 times</strong> — after
          that, restore the system or raise a new MOC to make the change
          permanent. The dashboard flags overdue temporary changes.
        </p>
      </Card>

      <Card title="Levels: complete the hazard assessment">
        <table className="text-sm border border-gray-300 w-full text-center">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-3 py-2 text-left">Change risk level</th>
              <th className="border border-gray-300 px-3 py-2">LOW significance</th>
              <th className="border border-gray-300 px-3 py-2">HIGH significance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-300 px-3 py-2 text-left font-medium">
                LOW degree of hazard
              </td>
              <td className="border border-gray-300 px-3 py-2 bg-vantage-50">Level 1</td>
              <td className="border border-gray-300 px-3 py-2 bg-sky-50">Level 2</td>
            </tr>
            <tr>
              <td className="border border-gray-300 px-3 py-2 text-left font-medium">
                HIGH degree of hazard
              </td>
              <td className="border border-gray-300 px-3 py-2 bg-amber-50">Level 3</td>
              <td className="border border-gray-300 px-3 py-2 bg-red-50">Level 4</td>
            </tr>
          </tbody>
        </table>
        <ul className="text-sm list-disc pl-5 mt-3 space-y-1">
          <li>Level 1 uses the simplified Level 1 form.</li>
          <li>Levels 2, 3, and 4 use the Level 2 form.</li>
          <li>Level 3 MOCs require a <strong>What-If</strong> Process Hazard Analysis.</li>
          <li>Level 4 MOCs require a <strong>HAZOP</strong> Process Hazard Analysis.</li>
        </ul>
      </Card>

      <Card title="How the workflow runs">
        <ol className="text-sm list-decimal pl-5 space-y-1.5">
          <li>
            <strong>Draft</strong> — the MOC Lead fills in the scope, hazard
            assessment, and checklists, and attaches supporting documents.
          </li>
          <li>
            <strong>Submit</strong> — the required approvers are notified.
            Approvals are electronic signatures: each signer types their name
            and re-enters their password; the decision is timestamped in the
            audit trail.
          </li>
          <li>
            <strong>Implementation</strong> — once approved to proceed, the work
            is done. Track punch list items on the record.
          </li>
          <li>
            <strong>Commissioning / handover</strong> (Level 2) — Production
            Manager confirms installation per design, documentation, and
            training before startup. If new equipment is installed, a{" "}
            <strong>PSSR</strong> is required.
          </li>
          <li>
            <strong>Close-out</strong> — the lead confirms the change works as
            designed, the checklist is complete, and remaining punch list items
            are tracked; Process Safety countersigns.
          </li>
        </ol>
        <p className="text-sm mt-2">
          If any approver selects <em>Not approved</em>, the record returns to
          the lead with comments for revision and resubmission.
        </p>
      </Card>

      <Card title="PSSR punch list categories">
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li><strong>A</strong> — required before reinventorying hazardous chemicals</li>
          <li><strong>B</strong> — required during hot commissioning</li>
          <li><strong>C</strong> — to be completed after start-up / prior to MOC closure</li>
        </ul>
      </Card>

      <Card title="Who signs what">
        <ul className="text-sm list-disc pl-5 space-y-1">
          <li><strong>Level 1:</strong> Process Safety + Relevant Manager (review); MOC Lead + Process Safety (close-out)</li>
          <li><strong>Level 2/3/4:</strong> Production Manager, Technical Authority, Maintenance Manager, EHSS Manager, Process Safety (approval to proceed); Production Manager (handover); MOC Lead + Process Safety (close-out)</li>
          <li><strong>MOOC:</strong> MOOC Lead + Relevant Manager (transition plan); Site Manager (final approval); MOOC Lead + Process Safety (close-out)</li>
          <li><strong>Bypass:</strong> Approving Manager + MOC Lead; PM + TA + EHSS Manager for &gt;72 h extensions; MOC Lead verifies return to service</li>
        </ul>
        <p className="text-xs text-ink-3 mt-2">
          Signatures route to the people holding each role at your site
          (managed by your administrator) and can be reassigned by Process
          Safety or the EHSS Manager when someone is unavailable.
        </p>
      </Card>
    </div>
  );
}
