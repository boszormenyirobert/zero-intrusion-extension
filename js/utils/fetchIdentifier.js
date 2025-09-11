export async function fetchIdentifier(path, payload) {
    try {
        const res = await fetch(path, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: payload
        })
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch (e) {
        console.error("Polling error:", e);
      }   

}