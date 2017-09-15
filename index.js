const GithubGraphQLApi = require('node-github-graphql');
const promisify = require('util').promisify;
const token = process.env.GITHUB_TOKEN;

const [_, __, user1, user2] = process.argv;

if (!user1 || !user2) {
  throw new Error('Expected two user names as command line args');
}

const github = new GithubGraphQLApi({
  token
});

process.on('unhandledRejection', error => {
  console.log('unhandledRejection', error, JSON.stringify(error, null, 2));
  process.exit(1);
});

const results = {
  issueUrls: {},
  [user1]: {
    issues: new Set(),
  },
  [user2]: {
    issues: new Set()
  }
};

async function doWork() {
  await Promise.all([
    getNextIssueComments(user1,undefined, 0),
    getNextIssueComments(user2,undefined, 0)
  ]);

  const instersectionIssues = Array.from(results[user1].issues).filter(issueComment => {
    return results[user2].issues.has(issueComment);
  });
  // console.log(JSON.stringify(results, null, 2));
  // console.log(pp(Array.from(results[user1].issues)));
  // console.log(pp(Array.from(results[user2].issues)));
  // console.log(user1, results[user1].issues.size);
  // console.log(user2, results[user2].issues.size);
  console.log(instersectionIssues);
}

doWork();

function pp(obj) {
  return JSON.stringify(obj, null, 2);
}

async function getNextIssueComments(user, cursor, counter) {
  const variables = {
    user,
    cursor
  }

  const res = await github.query(`
    query AppQuery ($user: String!, $cursor: String) {
      user(login: $user) {
        issueComments(first: 100, after: $cursor) {
          edges {
            node {
              issue {
                id,
                url
              }
            }
          },
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  `, variables);

  console.log(user, counter);
  const issueComments = res.data.user.issueComments;
  issueComments.edges.forEach(comment => {
    results[user].issues.add(comment.node.issue.url);
  });

  const pageInfo = issueComments.pageInfo;

  if (pageInfo.hasNextPage) {
    return await getNextIssueComments(user, pageInfo.endCursor, counter+1);
  }
}
