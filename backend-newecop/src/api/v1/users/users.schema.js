import * as z from "zod";

export const UserIdSchema = z.object({
  userId: z.preprocess(
    (a) => parseInt(z.string().parse(a)),
    z.number().positive()
  ),
});
