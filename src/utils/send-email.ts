import nodemailer from "nodemailer";
import { resetPasswordEmailTemplate } from "./reset-password-email-template.js";
import { activationEmailTemplate } from "./activation-email-template.js";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const message = ({
	email,
	subject,
	token,
	name,
	reset,
}: {
	email: string;
	subject: string;
	token: string;
	name: string;
	reset: boolean;
}) => {
	const pwdReset = resetPasswordEmailTemplate({
		link: `${process.env.FRONT_END_URL}/change-password?token=${token}`,
		name,
		email,
	});
	console.log(
		reset
			? `${process.env.FRONT_END_URL}/change-password?token=${token}`
			: `${process.env.FRONT_END_URL}/set-password?token=${token}`,
	);

	const accActivation = activationEmailTemplate({
		link: `${process.env.FRONT_END_URL}/set-password?token=${token}`,
		name,
		email,
	});
	return {
		from: process.env.EMAIL_FROM,
		to: email,
		subject: subject,
		text: "For clients with plaintext support only",
		html: reset ? pwdReset : accActivation,
	};
};
// const msg = {
//   to: 'alexlim@mmdt.cc', // Change to your recipient
//   from: 'aewnetu21@gmail.com', // Change to your verified sender
//   subject: 'Sending with SendGrid is Fun',
//   text: 'and easy to do anywhere, even with Node.js',
//   html: ' <p>Please follow this <a href="https://user-management-fe-five.vercel.app/set-password?token=${token}">link</a> to set your password.</p>',
// };
// function sendEmail() {
//   sgMail
//     .send(msg)
//     .then(() => {
//       console.log('Email sent');
//     })
//     .catch((error) => {
//       console.error(error);
//     });
// }
const transport = nodemailer.createTransport({
	host: process.env.EMAIL_HOST,
	port: Number(process.env.EMAIL_PORT),
	secure: false,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
	tls: {
		rejectUnauthorized: false,
	},
});

export { transport, message };
