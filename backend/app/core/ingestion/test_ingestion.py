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
    print(f"\n[3] Source files found for AST parsing: {len(files)}")

    for file in files:
        relative_path = Path(file).resolve().relative_to(repo_path)
        print(f"  - {relative_path}")

    # Step 4: Content Classification for RAG
    print("\n[4] Classifying repository content for RAG...")
    try:
        class_res = scanner.scan_and_classify(repo_path, repository_id=repo_url)
        print(f"Total files classified: {class_res.summary.total_files_scanned}")
        print(f"Processable for RAG:    {class_res.summary.processable_files}")
        print(f"Unsupported:            {class_res.summary.unsupported_files}")
        print("Breakdown by type:")
        for ftype, count in sorted(class_res.summary.counts_by_type.items()):
            print(f"  - {ftype:<15}: {count}")
        if class_res.summary.counts_by_language:
            print("Breakdown by language:")
            for lang, count in sorted(class_res.summary.counts_by_language.items()):
                print(f"  - {lang:<15}: {count}")
    except Exception as e:
        print(f"Classification failed: {e}")


    print("\n" + "=" * 60)
    print("INGESTION TEST COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    main()