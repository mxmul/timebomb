export async function readItem(_, id) {
  const resp = await fetch(`/.netlify/functions/read?id=${id}`);

  if (!resp.ok) {
    console.log("a");

    const data = await resp.json();
    throw new Error(JSON.stringify(data));
  }

  return resp.json();
}

export async function createItem(data) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };

  const resp = await fetch(`/.netlify/functions/create`, options);

  if (!resp.ok) {
    console.log("a");

    const data = await resp.json();
    throw new Error(JSON.stringify(data));
  }

  return resp.json();
}
