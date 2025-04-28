import http from "node:http";
import app from "./app.js";

const port = process.env.PORT;
const server = http.createServer(app);

server.listen(port, 0, () => {
	console.info("Listening on:", server.address());
});
