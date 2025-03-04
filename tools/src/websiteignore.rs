use glob::Pattern;
use std::{fs, path::Path};

/// Convert a file (.*ignore) into a vector of possible rules that we have to follow
// According to https://git-scm.com/book/en/v2/Git-Basics-Recording-Changes-to-the-Repository#_ignoring
pub fn rule_from_file(data: &str) -> Vec<String> {
    data.lines()
        .map(|p| p.trim().to_string()) // clean up lines
        .filter(|p| !p.is_empty()) // ignored, used for spacing + formatting
        .filter(|p| !p.starts_with('#')) // ignored, used for commenting
        .collect()
}

/// Check if a path is allowed to be included or not depending on the rules.
/// Returns true if allowed, false if not.
pub fn allow_path(path: &Path, rules: &[String]) -> bool {
    // if we have no rules, then we allow everything by default.
    if rules.is_empty() {
        return true;
    }

    // println!("\nProcessing path: {}", path.display());

    let mut rule_exist = false;
    let mut allowed = false;

    // for each rule pattern (double any)
    rules.iter().for_each(|pattern| {
        // sort out the rule negate
        let negate = pattern.starts_with('!');
        let mut pattern = (if negate { &pattern[1..] } else { pattern }).to_string();

        // add the all immportant any directory check.
        if !pattern.starts_with("**/") {
            pattern = format!("**/{}", pattern);
        }

        // add the all important any sub dir check
        if pattern.ends_with("/") {
            pattern = format!("{}**", pattern);
        }

        // compae the pattern
        let r = Pattern::new(&pattern)
            .unwrap()
            .matches(path.to_str().unwrap());

        // println!(
        //     "Pattern: {}, Result: {}, Negate: {}, Allowed: {}",
        //     pattern, r, negate, allowed
        // );

        // if we have a match, the rule exists. Hence ignore
        rule_exist = rule_exist || r;

        // println!("{:?}", rule_exist);

        // if we have a match, and it's negated. Include
        allowed = allowed || (r && negate);
    });

    // println!(
    //     "Final Result. Allowed: {}, Rule_exist: {}",
    //     allowed, rule_exist
    // );

    // If allowed, it's been negated hence we must allow it.
    if allowed {
        return true;
    }

    // then return if the rule exists or not.
    !rule_exist
}

/// Process a directory to find the .websiteignore and .gitignore folders, and then process those.
fn process_dir(path: &Path, mut rules: Vec<String>) -> Vec<String> {
    // println!("Processing directory: {}", path.display());

    // extned the rules as the parent directory rules are also important
    let ignore = path.join(".websiteignore");
    if ignore.exists() {
        rules.extend(rule_from_file(&fs::read_to_string(ignore).unwrap()));
    }

    let gignore = path.join(".gitignore");
    if gignore.exists() {
        rules.extend(rule_from_file(&fs::read_to_string(gignore).unwrap()));
    }

    // println!("Rules: {:?}", rules);

    fs::read_dir(path)
        .unwrap()
        .map(|f| {
            let mut results = vec![];
            let f = f.unwrap().path();

            // check if path allowed
            if allow_path(&f, &rules) {
                results.push(f.to_str().unwrap().to_string());
            }

            // if dir, we need to go deeper.
            if f.is_dir() {
                results.extend(process_dir(&f, rules.clone()));
            }

            results
        })
        .filter(|s| !s.is_empty()) // if empty, not worth keeping extra data
        .flatten()
        .collect::<Vec<String>>()
}

pub fn main() {
    let files = process_dir(Path::new("."), vec![]);

    fs::write(".include.txt", files.join("\n")).unwrap();
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::Path;

    #[test]
    fn test_rule_from_file() {
        let test_content = "
        # Comment
        *.txt
        !important.txt

        src/*.rs
    ";

        let rules = rule_from_file(test_content);
        assert_eq!(rules.len(), 3);
        assert!(rules.contains(&"*.txt".to_string()));
        assert!(rules.contains(&"!important.txt".to_string()));
        assert!(rules.contains(&"src/*.rs".to_string()));
    }

    #[test]
    fn test_allow_path() {
        let rules = vec![
            "*.txt".to_string(),
            "!important.txt".to_string(),
            "src/*.rs".to_string(),
        ];

        assert!(!allow_path(Path::new("test.txt"), &rules));
        assert!(allow_path(Path::new("important.txt"), &rules));
        assert!(!allow_path(Path::new("src/main.rs"), &rules));
        println!(
            "Path allowed: {:?}",
            allow_path(Path::new("src/subfolder/file.txt"), &rules)
        );
        assert!(allow_path(Path::new("src/subfolder/file.txt"), &rules));
    }

    #[test]
    fn test_process_dir() {
        // Create a temporary test directory structure
        fs::create_dir_all("test_dir/src").unwrap();
        fs::write("test_dir/.websiteignore", "*.txt\n!important.txt").unwrap();
        fs::write("test_dir/test.txt", "").unwrap();
        fs::write("test_dir/important.txt", "").unwrap();
        fs::write("test_dir/src/main.rs", "").unwrap();

        let files = process_dir(Path::new("test_dir"), vec![]);

        assert!(files.contains(&"test_dir/important.txt".to_string()));
        assert!(files.contains(&"test_dir/src/main.rs".to_string()));
        assert!(!files.contains(&"test_dir/test.txt".to_string()));

        // Cleanup
        fs::remove_dir_all("test_dir").unwrap();
    }
}
