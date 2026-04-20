/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import testplanRoutes from './routes/testplan.js'
import runRoutes from './routes/run.js'
import reportRoutes from './routes/reports.js'
import exportRoutes from './routes/export.js'
import settingsRoutes from './routes/settings.js'
import playwrightCasesRoutes from './routes/playwright/cases.js'
import playwrightRunRoutes from './routes/playwright/run.js'
import playwrightLogsRoutes from './routes/playwright/logs.js'
import playwrightSettingsRoutes from './routes/playwright/settings.js'
import playwrightExportRoutes from './routes/playwright/export.js'
import playwrightNativeRoutes from './routes/playwright/native.js'

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/testplan', testplanRoutes)
app.use('/api/runs', runRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/export', exportRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/playwright/cases', playwrightCasesRoutes)
app.use('/api/playwright/run', playwrightRunRoutes)
app.use('/api/playwright/logs', playwrightLogsRoutes)
app.use('/api/playwright/settings', playwrightSettingsRoutes)
app.use('/api/playwright/export', playwrightExportRoutes)
app.use('/api/playwright/native', playwrightNativeRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (_req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((_error: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
