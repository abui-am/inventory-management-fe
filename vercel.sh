if [[ "$VERCEL_GIT_COMMIT_REF" == "$BRANCH_TO_BUILD" ]] ; then
  # Proceed with the build
    echo "✅ - Build can proceed"
  exit 1;
else
  # Don't build
  echo "$VERCEL_GIT_COMMIT_REF	
  echo "$BRANCH_TO_BUILD"
  echo "🛑 - Build canceled"
  exit 0;
fi