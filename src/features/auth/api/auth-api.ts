export async function tryLogin(email: string, password: string) {
  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    if (response.status === 403) throw new Error("Is not admin");
    throw new Error(`Network response was not ok ${response.statusText}`);
  }

  return (await response.json()) as unknown;
}
