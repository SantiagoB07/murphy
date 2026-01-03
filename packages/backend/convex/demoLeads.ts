import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    nombre: v.string(),
    tipoUsuario: v.union(
      v.literal("paciente"),
      v.literal("coadministrador"),
      v.literal("medico")
    ),
    celular: v.string(),
    email: v.string(),
    fechaContacto: v.optional(v.string()),
    horaContacto: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const leadId = await ctx.db.insert("demoLeads", {
      nombre: args.nombre,
      tipoUsuario: args.tipoUsuario,
      celular: args.celular,
      email: args.email,
      fechaContacto: args.fechaContacto,
      horaContacto: args.horaContacto,
      createdAt: Date.now(),
    });

    return leadId;
  },
});
