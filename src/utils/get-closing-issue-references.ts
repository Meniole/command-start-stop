export const QUERY_CLOSING_ISSUE_REFERENCES = /* GraphQL */ `
  query closingIssueReferences($owner: String!, $repo: String!, $issue_number: Int!, $cursor: String) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $issue_number) {
        id
        closingIssuesReferences(first: 10, after: $cursor) {
          nodes {
            id
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  }
`;