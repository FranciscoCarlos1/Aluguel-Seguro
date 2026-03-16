const aluguelSeguroHost = window.location.hostname || "localhost";
const aluguelSeguroIsLocal =
	aluguelSeguroHost === "localhost" || aluguelSeguroHost === "127.0.0.1";

window.ALUGUEL_API_BASE_URL = aluguelSeguroIsLocal
	? `http://${aluguelSeguroHost === "127.0.0.1" ? "127.0.0.1" : "localhost"}:8000/api/v1`
	: "https://aluguel-seguro-api.onrender.com/api/v1";
