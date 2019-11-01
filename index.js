const GithubGraphQLApi = require('node-github-graphql');
const token = process.env.GITHUB_TOKEN;

const github = new GithubGraphQLApi({
  token
});

process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error, JSON.stringify(error, null, 2));
  process.exit(1);
});

let issues = [];

async function doWork() {
  await getIssues(undefined, 0);

  console.log(pp(issues));
}

doWork();

function pp(obj) {
  return JSON.stringify(obj, null, 2);
}

async function getIssues(cursor, counter) {
  const variables = {
    cursor
  }

  const res = await github.query(`
    query($cursor: String) {
      repository(owner:"facebook", name: "react-native") {
        issues(first: 100, states:OPEN, after: $cursor) {
          nodes {
            number,
            title,
            author {
              login,
              url,
            },
            comments (last: 1) {
              nodes {
                createdAt,
              },
              totalCount
            },
            reactions {
              totalCount
            },
            createdAt,
            url,
            labels(first: 10) {
              nodes {
                name
              }
            },
          },
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  `, variables);

  console.error(counter);

  const fetchedIssues = res.data.repository.issues;
  issues = issues.concat(fetchedIssues.nodes);

  const pageInfo = fetchedIssues.pageInfo;

  if (pageInfo.hasNextPage) {
    return await getIssues(pageInfo.endCursor, counter+1);
  }
}
