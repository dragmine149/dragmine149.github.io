use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
struct Blog {
    date: String,
    categories: Vec<String>,
    preview: String,
}

fn main() {
    // assuming we're running this in the root
    let paths = fs::read_dir("Blog/Posts").unwrap();
    let mut blogs: Vec<Blog> = vec![];

    for path in paths {
        let p = path.unwrap().path();
        if p.is_dir() {
            // don't worry about directories
            continue;
        }
        if p.extension().unwrap() != "md" {
            // only do those of markdown files
            continue;
        }
        let date = p.file_stem().unwrap().to_str().unwrap().to_string();
        if date == "next" {
            // This is mainly just to avoid the next file whilst testing locally.
            continue;
        }

        println!("Translating: {:?}", date);

        // read the blog data. Is there a better way of doing this?
        let blog_data = fs::read_to_string(p).unwrap_or(String::new());
        let mut lines = blog_data.lines();
        // first line is always preview line with the hash
        let preview = lines
            .next()
            .unwrap()
            .to_string()
            .replace("#", "")
            .trim()
            .to_string();
        // categories will be at the end, out of the way
        let last_line = lines.last().unwrap();
        let categories: Vec<String> = if last_line.starts_with("Categories: ") {
            last_line
                .replace("Categories: [", "")
                .replace("]", "")
                .split_whitespace()
                .map(|c| c.replace(",", ""))
                .collect()
        } else {
            vec![]
        };
        println!("Categories: {:?}", categories);

        if categories.contains(&"hidden".to_string()) {
            // not meant to be include in the main list
            continue;
        }

        blogs.push(Blog {
            date,
            preview,
            categories,
        })
    }

    println!("{:?}", blogs);
    blogs.sort_by(|a, b| b.date.cmp(&a.date));

    // convert to json
    let json = serde_json::to_string(&blogs).unwrap();
    println!("{}", json);

    // save the json
    let result = fs::write("Blog/list.json", json);
    println!("{:?}", result);

    // make the rss feed
    let mut rss = "<rss version=\"2.0\" xmlns:atom=\"http://www.w3.org/2005/Atom\">\n".to_string();
    rss.push_str("\t<channel>\n");
    rss.push_str("\t\t<title>Drag's Blog</title>\n");
    rss.push_str("\t\t<link>https://dragmine149.github.io/Blog</link>\n");
    rss.push_str("\t\t<description>Recently updated blog from dragmine149's blog</description>\n");

    for blog in &blogs {
        rss.push_str(&"\t\t<item>\n");
        rss.push_str(&format!("\t\t\t<title>{}</title>\n", blog.date));
        rss.push_str(&format!("\t\t\t<link>https://dragmine149.github.io/Blog?blog={}</link>\n", blog.date));
        rss.push_str(&format!("\t\t\t<description>{}</description>\n", blog.preview));
        for category in &blog.categories {
            rss.push_str(&format!("\t\t\t<category>{}</category>\n", category));
        }
        rss.push_str("\t\t</item>\n");
    }

    rss.push_str("\t</channel>\n</rss>");

    let result = fs::write("Blog/feed.xml", rss);
    println!("{:?}", result);
}
