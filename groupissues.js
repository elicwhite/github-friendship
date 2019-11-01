const issues = require('./issues');

const NUM_GROUPS = 4;
const groupIssues = new Array(NUM_GROUPS).fill(null).map(() => { return [] });

const sortedIssues = issues.sort((first, second) => {
  const firstWeight = first.comments.totalCount + first.reactions.totalCount /2;
  const secondWeight = second.comments.totalCount + second.reactions.totalCount /2;

  return secondWeight-firstWeight;
});

const discussions = sortedIssues.filter(issue => {
  return issue.labels.nodes.some(node => node.name.includes('Discussion'));
});

sortedIssues.filter(issue => {
  return issue.labels.nodes.every(node => !node.name.includes('Discussion'));
}).forEach((issue, index) => {
  const assignedGroup = index % NUM_GROUPS;
  groupIssues[assignedGroup].push(issue);
})

function formatIssue(issue) {
  const commentNodes = issue.comments.nodes || [];
  const lastCommentTime = (commentNodes[0] || {}).createdAt;

  let lastCommentedString = lastCommentTime != null ? `, Last Commented: ${new Intl.DateTimeFormat('en-GB').format(Date.parse(lastCommentTime))}` : '';

  return ` - [ ] #${issue.number} [${issue.title.slice(0, 50).trim()}](${issue.url}), ${issue.comments.totalCount} comments, ${issue.reactions.totalCount} reactions, Created: ${new Intl.DateTimeFormat('en-GB').format(Date.parse(issue.createdAt))}${lastCommentedString}`;
}

groupIssues.map((group, index) => {
  console.log(`\n### Group ${index + 1}`);

  // const searchQuery = `https://github.com/facebook/react-native/issues?q=${
  //   group.map(issue => issue.number).join('+')
  // }`
  //
  // console.log(`[Github Issue Search](${searchQuery})`);

  group.forEach(issue => {
    console.log(formatIssue(issue));
  })
})

console.log(`\n### Discussions`);
discussions.forEach(issue => {
  console.log(formatIssue(issue));
})
