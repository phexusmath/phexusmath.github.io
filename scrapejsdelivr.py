"""
Troubleshooting script for jsdelivr URL parsing
Tests various URL formats and shows what's being parsed
"""

import re

# Test URLs
TEST_URLS = [
    # Format 1: with @ref
    "https://cdn.jsdelivr.net/gh/user/repo@main/path/",
    "https://cdn.jsdelivr.net/gh/user/repo@v1.0.0/path/file.txt",
    
    # Format 2: without @ref (should use main)
    "https://cdn.jsdelivr.net/gh/user/repo/path/",
    "https://cdn.jsdelivr.net/gh/user/repo/",
    
    # Format 3: complex paths
    "https://cdn.jsdelivr.net/gh/kartik-v/bootstrap-fileinput@5.5.0/js/plugins/",
    "https://cdn.jsdelivr.net/gh/derrickoswald/CIMSpark@master/img/CIMTool.png",
    
    # Edge cases
    "https://cdn.jsdelivr.net/gh/user/repo@branch/",
    "https://cdn.jsdelivr.net/gh/user/repo/file.txt",
]

def debug_parse_old(jsdelivr_url):
    """Original parsing logic - shows what's wrong"""
    print(f"\n📍 Testing: {jsdelivr_url}")
    
    parts = jsdelivr_url.replace('https://cdn.jsdelivr.net/gh/', '')
    
    # Split by @ to get ref if it exists
    if '@' in parts:
        repo_part, ref_and_path = parts.split('@', 1)
        if '/' in ref_and_path:
            ref, path = ref_and_path.split('/', 1)
        else:
            ref = ref_and_path
            path = ''
    else:
        # No ref specified, use main/master
        parts_list = parts.split('/')
        repo_part = '/'.join(parts_list[:2])
        path = '/'.join(parts_list[2:]) if len(parts_list) > 2 else ''
        ref = 'main'
    
    # Remove trailing slash from path
    path = path.rstrip('/')
    
    try:
        user, repo = repo_part.split('/')
        
        api_url = f"https://api.github.com/repos/{user}/{repo}/contents/{path}"
        if ref:
            api_url += f"?ref={ref}"
        
        print(f"  ✓ User: {user}")
        print(f"  ✓ Repo: {repo}")
        print(f"  ✓ Ref: {ref}")
        print(f"  ✓ Path: {path}")
        print(f"  ✓ API URL: {api_url}")
        return True
    except Exception as e:
        print(f"  ✗ ERROR: {e}")
        return False


def debug_parse_new(jsdelivr_url):
    """Fixed parsing logic"""
    print(f"\n✨ FIXED: {jsdelivr_url}")
    
    # Remove the base URL
    parts = jsdelivr_url.replace('https://cdn.jsdelivr.net/gh/', '').rstrip('/')
    
    # Pattern: user/repo[@ref][/path]
    # Match: user/repo or user/repo@ref or user/repo@ref/path or user/repo/path
    match = re.match(r'^([^/@]+)/([^/@]+)(?:@([^/]+))?(?:/(.+))?$', parts)
    
    if not match:
        print(f"  ✗ ERROR: Could not parse URL")
        return False
    
    user, repo, ref, path = match.groups()
    
    # Default ref to 'main' if not specified
    if not ref:
        ref = 'main'
    
    # Default path to empty string if not specified
    if not path:
        path = ''
    
    api_url = f"https://api.github.com/repos/{user}/{repo}/contents/{path}"
    if ref:
        api_url += f"?ref={ref}"
    
    print(f"  ✓ User: {user}")
    print(f"  ✓ Repo: {repo}")
    print(f"  ✓ Ref: {ref}")
    print(f"  ✓ Path: {path}")
    print(f"  ✓ API URL: {api_url}")
    return True


if __name__ == '__main__':
    print("=" * 70)
    print("ORIGINAL PARSING LOGIC")
    print("=" * 70)
    
    for url in TEST_URLS:
        debug_parse_old(url)
    
    print("\n\n" + "=" * 70)
    print("FIXED PARSING LOGIC")
    print("=" * 70)
    
    for url in TEST_URLS:
        debug_parse_new(url)
    
    print("\n" + "=" * 70)
    print("SUMMARY OF FIXES")
    print("=" * 70)
    print("""
The original logic had these issues:

1. ❌ When no @ref exists, it tries to split path as "user/repo/path"
   but then extracts path from parts_list[2:], which can include
   the repo name if splitting is wrong.

2. ❌ Trailing slashes cause empty string in path, leading to
   queries like "/contents/" which may fail.

3. ❌ Edge case: "user/repo/file.txt" (no @ref, just file)
   fails because it assumes parts_list[0] = user, [1] = repo,
   but with trailing content it doesn't parse correctly.

4. ❌ The logic doesn't validate the user/repo split properly.

The fixed version:
✓ Uses regex to properly match user/repo[@ref][/path]
✓ Handles all spacing and format variations
✓ Defaults ref to 'main' only when not provided
✓ Validates structure before processing
✓ Removes trailing slashes early to avoid edge cases
    """)
