import nodemailer from "nodemailer";
import { resetPasswordEmailTemplate } from "./reset-password-email-template.js";
import { activationEmailTemplate } from "./activation-email-template.js";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { registrationOTPEmailTemplate } from "./registration-otp-email-template.js";
import sGMail, { type MailDataRequired } from "@sendgrid/mail";
import { ENVOBJ } from "./common-types.js";
const env = ENVOBJ.parse(process.env);
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
sGMail.setApiKey(env.EMAIL_PASS || "");
const message = ({
	email,
	subject,
	token,
	name,
	reset,
	reason,
}: {
	email: string;
	subject: string;
	token: string;
	name: string;
	reset: boolean;
	reason?: "reset" | "activation" | "otp";
}) => {
	const pwdReset = resetPasswordEmailTemplate({
		link: `${env.FRONT_END_URL}/change-password?token=${token}`,
		name,
		email,
	});
	console.log(
		reset
			? `${env.FRONT_END_URL}/change-password?token=${token}`
			: `${env.FRONT_END_URL}/set-password?token=${token}`,
	);

	const accActivation = activationEmailTemplate({
		link: `${env.FRONT_END_URL}/set-password?token=${token}`,
		name,
		email,
	});
	const otpEmail = registrationOTPEmailTemplate({
		code: Number.parseInt(token),
		name,
		email,
	});
	const obj: MailDataRequired = {
		from: env.EMAIL_FROM,
		to: email,
		subject: subject,
		text: "For clients with plaintext support only",
		html: reason === "otp" ? otpEmail : reset ? pwdReset : accActivation,
	};
	return obj;
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
	host: env.EMAIL_HOST,
	port: Number(env.EMAIL_PORT),
	secure: false,
	auth: {
		user: env.EMAIL_USER,
		pass: env.EMAIL_PASS,
	},
	tls: {
		rejectUnauthorized: false,
	},
});

const mailer = {
	send: (msg: MailDataRequired | nodemailer.SendMailOptions) => {
		if (env.NODE_ENV === "production") {
			return sGMail.send(msg as MailDataRequired);
		}
		return transport.sendMail(msg as nodemailer.SendMailOptions);
	},
};

export { mailer, transport, message };
