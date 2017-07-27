import Head from 'next/head'
import withData from '../lib/withData'
import { gql, graphql } from 'react-apollo'

export default withData((props) => (
  <div>
    <Head>
      <meta name='viewport' content='width=device-width, initial-scale=1'/>
    </Head>
    <Report />

    <style global jsx>{`
      html {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        font-size: 14px;
        line-height: 1.5;
        color: #24292e;
      }
      body {
        margin: 0;
      }
    `}</style>
  </div>
))

const allTests = gql`
  query allTests {
    tests {
      id
      name
      duration
      state
      screenshots {
        id
        platform
        browserName
        resolution
        name
        referenceUrl
        diffUrl
        takenUrl
      }
    }
  }
`

const Report_ = ({ data: { tests, loading } }) => (
  <div>{tests.map((test, i) => <Test key={i} {...test} />)}</div>
)

const Report = graphql(allTests, {})(Report_);

const Test = ({name, state, screenshots}) => (
  <div className="test">
    <div className={"header " + state}>{name}: {state}</div>

    <div className="screenshots">
      {screenshots.map((x, i) => <Screenshot key={i} {...x} />)}
    </div>

    <style jsx>{`
      .test {
        margin-bottom: 20px;
      }
      .header {
        padding: 4px 7px;
        color: white;
      }
      .header.pass {
        background-color: #0f710f;
      }
      .header.fail {
        background-color: #a00202;
      }
      .images {
        display: flex;
        justify-content: flex-start;
      }
      img {
        display: block;
      }
    `}</style>
  </div>
)

const Screenshot = ({id, name, platform, browserName, resolution, referenceUrl, takenUrl, diffUrl}) => (
  <div className="screenshot">
    <div className={"header" + (diffUrl === null ? '' : ' fail')}>
      Screenshot: {name}
      {diffUrl && <AcceptImage testId="" screenshotId={id} />}
    </div>
    <div className="images">
      <div className="image">
        <img src={referenceUrl} />
      </div>
      <div className="image">
        {takenUrl && <img src={takenUrl} />}
      </div>
      <div className="image">
        {diffUrl && <img src={diffUrl} />}
      </div>
    </div>

    <style jsx>{`
      .screenshot {
        margin: 20px 0 20px 20px;
      }
      .header {
        padding: 4px 7px;
        color: white;
        background-color: #24292e;
      }
      .header.fail {
        background-color: #a00202;
      }
      .images {
        display: flex;
        justify-content: flex-start;
      }
      .image {
        flex: 1;
        padding: 20px;
        background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAAAAACoWZBhAAAAF0lEQVQI12P4BAI/QICBFCaYBPNJYQIAkUZftTbC4sIAAAAASUVORK5CYII=");
        margin: 20px 10px;
      }
      img {
        display: block;
        width: 100%;
      }
    `}</style>
  </div>
)

const acceptImage = gql`
  mutation acceptImage($testId: ID!, $screenshotId: ID!) {
    acceptImage(testId: $testId, screenshotId: $screenshotId) {
      id
      diffUrl
      referenceUrl
    }
  }
`;
const AcceptImage_ = ({ testId, screenshotId, mutate }) => (
  <button onClick={() => mutate({ variables: { testId, screenshotId }})}>Accept Image</button>
)
const AcceptImage = graphql(acceptImage)(AcceptImage_);
