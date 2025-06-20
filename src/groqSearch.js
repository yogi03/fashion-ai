export async function getFilteredQuery(userQuery) {
  try {
    const res = await fetch('http://localhost:5000/api/groq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: userQuery }),
    });

    return await res.json();
  } catch (err) {
    console.error('Fetch error:', err);
    return null;
  }
}
