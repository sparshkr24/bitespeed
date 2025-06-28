import { errorHandler, notFoundHandler } from "./handleErrors"
import { limiter } from "./rateLimiter"
import { baseRouteHandler, healthCheckHandler } from "./healthRoutes"

const middlewares = {
    limiter,
    notFoundHandler,
    errorHandler,
    baseRouteHandler,
    healthCheckHandler,
}

export default middlewares;