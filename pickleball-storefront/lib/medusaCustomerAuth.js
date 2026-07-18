const BACKEND_URL =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000";
const API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

export class AuthError extends Error {
  constructor(message = "請先登入會員", status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function getMedusaCustomer(req) {
  const authorization = req.headers.authorization || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  if (!token) throw new AuthError();

  let response;
  try {
    response = await fetch(`${BACKEND_URL}/store/customers/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-publishable-api-key": API_KEY,
      },
    });
  } catch {
    throw new AuthError("會員服務暫時無法連線", 503);
  }

  if (!response.ok) {
    throw new AuthError(
      response.status === 401 ? "登入已失效，請重新登入" : "無法驗證會員身分",
      response.status === 401 ? 401 : 502,
    );
  }

  const payload = await response.json();
  const customer = payload.customer || payload;
  if (!customer?.id || !customer?.email) throw new AuthError();

  return {
    id: customer.id,
    email: String(customer.email).trim().toLowerCase(),
    name:
      [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim() ||
      customer.email.split("@")[0],
    avatar: customer.metadata?.avatar_url || null,
    phone: customer.phone || null,
  };
}
