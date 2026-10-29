import sys
from pathlib import Path

from app.core.ingestion.git_fetcher import GitFetcher
from app.core.ingestion.scanner import RepoScanner


def main():
    if len(sys.argv) != 2:
        print("Usage: python -m app.core.ingestion.test_ingestion <repo_url>")
        sys.exit(1)

    repo_url = sys.argv[1]

    print("=" * 60)
    print("CODE SPEC AI - INGESTION TEST")
    print("=" * 60)

    # Step 1: Clone repository
    print("\n[1] Fetching repository...")

    fetcher = GitFetcher()

    try:
        repo_path = Path(fetcher.fetch(repo_url)).resolve()
        print(f"Repository downloaded to:")
        print(repo_path)
    except Exception as e:
        print(f"Git fetch failed: {e}")
        sys.exit(1)


    # Step 2: Scan repository
    print("\n[2] Scanning repository...")

    scanner = RepoScanner()

    try:
        files = scanner.scan(repo_path)
    except Exception as e:
        print(f"Scanning failed: {e}")
        sys.exit(1)


    # Step 3: Display results
    print(f"\n[3] Files found: {len(files)}")

    for file in files:
        relative_path = Path(file).resolve().relative_to(repo_path)
        print(f"  - {relative_path}")


    print("\n" + "=" * 60)
    print("INGESTION TEST COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    main()