import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional(),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    company: z.string().max(200).optional(),
    phone: z.string().max(30).optional(),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Verification token required'),
  }),
});

export const resendVerificationSchema = z.object({
  body: z.object({}).optional(),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }).optional(),
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }).optional(),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

export const meSchema = z.object({});

export const impersonateSchema = z.object({
  body: z.object({
    userId: z.string().min(1, 'User ID required'),
  }),
});

export const stopImpersonationSchema = z.object({
  body: z.object({
    adminId: z.string().min(1, 'Admin ID required'),
  }),
});

export const schemas = {
  login: loginSchema,
  register: registerSchema,
  verifyEmail: verifyEmailSchema,
  resendVerification: resendVerificationSchema,
  refresh: refreshSchema,
  logout: logoutSchema,
  forgotPassword: forgotPasswordSchema,
  resetPassword: resetPasswordSchema,
  me: meSchema,
  impersonate: impersonateSchema,
  stopImpersonation: stopImpersonationSchema,
  createCampaign: z.object({
    body: z.object({
      campaignName: z.string().min(1, 'Campaign name is required').max(200),
      campaignDescription: z.string().max(1000).optional(),
      file: z.any().optional(),
      mapping: z.any().optional(),
      aiConfig: z.any().optional(),
      scheduleConfig: z.any().optional(),
    }),
  }),
  getCampaigns: z.object({
    query: z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }).optional(),
  }),
  getCampaign: z.object({
    params: z.object({
      id: z.string().min(1),
    }),
  }),
  updateCampaign: z.object({
    params: z.object({
      id: z.string().min(1),
    }),
    body: z.object({
      campaignName: z.string().min(1).max(200).optional(),
      campaignDescription: z.string().max(1000).optional(),
      file: z.any().optional(),
      mapping: z.any().optional(),
      aiConfig: z.any().optional(),
      scheduleConfig: z.any().optional(),
      contactCount: z.number().int().min(0).optional(),
      estimatedCost: z.string().optional(),
      estimatedDuration: z.string().optional(),
      status: z.string().optional(),
    }),
  }),
  deleteCampaign: z.object({
    params: z.object({
      id: z.string().min(1),
    }),
  }),
};

export function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: err.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        });
      }
      next(err);
    }
  };
}