const express = require('express')
const bodyParser = require('body-parser')
const { graphqlExpress, graphiqlExpress } = require('graphql-server-express')
const { makeExecutableSchema } = require('graphql-tools')
const fs = require('fs')
const next = require('next')
const recursiveReadSync = require('recursive-readdir-sync');
const morgan = require('morgan')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const executableSchema = makeExecutableSchema({
  typeDefs: fs.readFileSync('schema.graphql', 'utf8'),
  resolvers: {
    RootQuery: {
      tests() {
        const reportFiles = fs.readdirSync('../../').filter(x => x.match(/^WDIO/));
        if (reportFiles.length === 0) {
          return [];
        }

        const reportFile = reportFiles[0];
        const report = require('../../' + reportFile);
        return report.suites[1].tests;
      },
    },

    Mutation: {
      acceptImage(_, { screenshotId }) {
        const screenshot = screenshotId.split(':')[1];
        const b = fs.readFileSync(`../../screenshots/taken/${screenshot}`)
        fs.writeFileSync(`../../screenshots/reference/${screenshot}`, b)
        fs.unlinkSync(`../../screenshots/diff/${screenshot}`, b)

        return {
          id: screenshotId,
          diffUrl: null,
          referenceUrl: `/screenshots/reference/${screenshot}`
        };
      }
    },

    Test: {
      id({ name }) {
        return name;
      },
      screenshots({ name }) {
        const basePath = '../../screenshots/reference/' + name;
        return recursiveReadSync(basePath).map(x => {
          const [platform, browserName, resolution, screenshotName] = x
            .replace(basePath + '/', '')
            .split('/')


          const takenPath = '../../screenshots/taken/' + x.replace('../../screenshots/reference/', '');
          const takenUrl = fs.existsSync(takenPath)
            ? takenPath.replace('../..', '')
            : null;

          const diffPath = '../../screenshots/diff/' + x.replace('../../screenshots/reference/', '');
          const diffUrl = fs.existsSync(diffPath)
            ? diffPath.replace('../..', '')
            : null;

          return {
            id: name + ':' + x.replace('../../screenshots/reference/', ''),
            name: screenshotName,
            platform,
            browserName,
            resolution,
            referenceUrl: x.replace('../..', ''),
            takenUrl,
            diffUrl,
          };
        })
      }
    }
  }
})

app.prepare().then(() => {
  const server = express()

  server.use(morgan(':method :url :status :res[content-length] - :response-time ms'))

  server.use('/screenshots', express.static('../../screenshots'))

  server.use(
     '/graphql',
     bodyParser.json(), graphqlExpress({ schema: executableSchema }));

  server.use(
    '/graphiql',
    graphiqlExpress({
      endpointURL: '/graphql',
      query: `{
  tests {
    id
    name
    duration
    state
    screenshots {
      id
      name
      platform
      browserName
      resolution
      referenceUrl
      takenUrl
      diffUrl
    }
  }
}
`
    })
  )

  server.get('*', (req, res) => {
    handle(req, res)
  })

  server.listen(3000)
})