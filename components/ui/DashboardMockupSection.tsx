'use client';

// Days remaining: from today (2026-04-28) to May 18, 2026 = 20 days
const DAYS_LEFT = (() => {
  const today = new Date('2026-04-28');
  const target = new Date('2026-05-18');
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
})();

const tableRows = [
  { donor: 'Carlos M.', amount: '+RD$500', date: 'Apr 26' },
  { donor: 'Ana L.', amount: '+RD$1,200', date: 'Apr 26' },
  { donor: 'Anonymous', amount: '+RD$750', date: 'Apr 25' },
  { donor: 'Ramón D.', amount: '+RD$200', date: 'Apr 25' },
];

export default function DashboardMockupSection() {
  return (
    <section style={{
      background: '#F6F6F4',
      padding: '56px 24px',
      textAlign: 'center',
    }}>
      <h2 style={{
        fontWeight: 600,
        fontSize: '22px',
        color: '#2B2F36',
        letterSpacing: '-0.02em',
        margin: '0 0 6px',
      }}>
        See everything in real time
      </h2>
      <p style={{
        fontSize: '13px',
        color: '#767676',
        margin: '0 0 32px',
      }}>
        Your dashboard tracks every donation the moment it happens.
      </p>

      {/* Browser chrome mockup */}
      <div style={{
        maxWidth: '700px',
        margin: '0 auto',
        border: '1px solid #E8E8E5',
        borderRadius: '10px',
        overflow: 'hidden',
        background: 'white',
        textAlign: 'left',
      }}>
        {/* Chrome bar */}
        <div style={{
          background: '#F6F6F4',
          padding: '7px 14px',
          borderBottom: '1px solid #E8E8E5',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E8E8E5', flexShrink: 0 }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E8E8E5', flexShrink: 0 }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#E8E8E5', flexShrink: 0 }} />
          <div style={{
            flex: 1,
            background: 'white',
            border: '1px solid #E8E8E5',
            borderRadius: '3px',
            padding: '2px 10px',
            fontSize: '10px',
            color: '#767676',
          }}>
            dashboard.impulso.do
          </div>
        </div>

        {/* Candidate bar */}
        <div style={{
          padding: '8px 14px',
          borderBottom: '1px solid #E8E8E5',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#C8102E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              fontWeight: 700,
              color: 'white',
              flexShrink: 0,
            }}>
              MF
            </div>
            <span style={{ fontSize: '10px', fontWeight: 600, color: '#2B2F36' }}>
              María Fernández · Running for Mayor
            </span>
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#C8102E' }} />
            <span style={{ fontSize: '9px', fontWeight: 600, color: '#C8102E' }}>Live</span>
          </div>
        </div>

        {/* Inner padding area */}
        <div style={{ padding: '12px' }}>
          {/* Stats grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '6px',
            marginBottom: '12px',
          }}>
            {[
              { label: 'TOTAL RAISED', value: 'RD$3.35M' },
              { label: 'DONORS', value: '2,847' },
              { label: 'AVG. DONATION', value: 'RD$435' },
              { label: 'DAYS LEFT', value: String(DAYS_LEFT) },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: '#F6F6F4',
                borderRadius: '6px',
                padding: '8px 10px',
              }}>
                <div style={{
                  fontSize: '8px',
                  textTransform: 'uppercase',
                  color: '#767676',
                  letterSpacing: '0.06em',
                  marginBottom: '2px',
                }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#2B2F36' }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px' }}>
            <thead>
              <tr>
                {['Donor', 'Amount', 'Date', 'Actions'].map((col) => (
                  <th key={col} style={{
                    fontSize: '8px',
                    textTransform: 'uppercase',
                    color: '#767676',
                    padding: '5px 6px',
                    borderBottom: '1px solid #E8E8E5',
                    textAlign: 'left',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.donor + row.date}>
                  <td style={{ padding: '6px 6px', borderBottom: '1px solid #F6F6F4', color: '#2B2F36' }}>
                    {row.donor}
                  </td>
                  <td style={{
                    padding: '6px 6px',
                    borderBottom: '1px solid #F6F6F4',
                    color: '#16A34A',
                    fontWeight: 600,
                  }}>
                    {row.amount}
                  </td>
                  <td style={{ padding: '6px 6px', borderBottom: '1px solid #F6F6F4', color: '#767676' }}>
                    {row.date}
                  </td>
                  <td style={{ padding: '6px 6px', borderBottom: '1px solid #F6F6F4' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button style={{
                        fontSize: '8px',
                        fontWeight: 600,
                        background: '#F6F6F4',
                        border: '1px solid #E8E8E5',
                        color: '#2B2F36',
                        borderRadius: '3px',
                        padding: '2px 6px',
                        cursor: 'pointer',
                      }}>
                        Send thank you
                      </button>
                      <button style={{
                        fontSize: '8px',
                        fontWeight: 600,
                        background: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        color: '#1D4ED8',
                        borderRadius: '3px',
                        padding: '2px 6px',
                        cursor: 'pointer',
                      }}>
                        Call
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
