import z from "zod";

export const Email = z.object({
	email: z
		.string({ message: "please include email in your request body" })
		.email(),
});
export type Email = z.infer<typeof Email>;
