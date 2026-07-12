export const errorHandler = (err, req, res, _next) => {
  console.error('[System Error Handler]', err);

  const errorResponse = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred on the server.',
    },
  };

  // Zod Validation Errors Formatting
  if (err.name === 'ZodError') {
    errorResponse.error.code = 'INVALID_INPUT';
    errorResponse.error.message = 'The data submitted failed schema validations.';
    errorResponse.error.details = err.errors.map((x) => ({
      field: x.path.join('.'),
      message: x.message,
    }));
    return res.status(400).json(errorResponse);
  }

  // Prisma unique constraint violation (P2002)
  if (err.code === 'P2002') {
    errorResponse.error.code = 'RESOURCE_ALREADY_EXISTS';
    errorResponse.error.message = `Conflict: Field '${err.meta?.target?.join(', ')}' already exists.`;
    return res.status(409).json(errorResponse);
  }

  // Prisma record not found (P2025)
  if (err.code === 'P2025') {
    errorResponse.error.code = 'RESOURCE_NOT_FOUND';
    errorResponse.error.message = 'The requested resource was not found.';
    return res.status(404).json(errorResponse);
  }

  const status = err.statusCode || 500;
  return res.status(status).json(errorResponse);
};

export default errorHandler;
