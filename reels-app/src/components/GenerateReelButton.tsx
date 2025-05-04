'use client';

export function GenerateReelButton() {
  return (
    <button
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 1000,
        background: '#222',
        color: 'white',
        border: 'none',
        borderRadius: 8,
        padding: '10px 18px',
        fontWeight: 600,
        fontSize: 16,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}
      onClick={async () => {
        const name = prompt('Enter a sports celebrity name:');
        if (!name) return;
        try {
          const res = await fetch('/api/reels/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ celebrityName: name })
          });
          if (res.ok) {
            alert('Reel generation started! Check S3 for the result.');
          } else {
            const data = await res.json();
            alert('Error: ' + (data.error || 'Unknown error'));
          }
        } catch {
          alert('Network error.');
        }
      }}
    >
      Generate AI Reel
    </button>
  );
} 