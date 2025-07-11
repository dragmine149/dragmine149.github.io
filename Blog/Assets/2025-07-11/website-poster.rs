use mastodon_async::helpers::toml;
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};
use time::format_description;

#[derive(Debug, Deserialize, Serialize, Clone)]
struct BlogFeedEntry {
    date: String,
    categories: Vec<String>,
    preview: String,
}

const URL: &str = "https://dragmine149.github.io/Blog/list.json";

#[tokio::main]
async fn main() {
    let data = reqwest::get(URL).await;
    if data.is_err() {
        eprintln!("Failed to get blog post data, Cancelling.");
        return;
    }

    let json = data.unwrap().json::<Vec<BlogFeedEntry>>().await;
    if json.is_err() {
        eprintln!("Failed to process json!");
        return;
    }
    let json_result = json.unwrap();

    let format = format_description::parse("[year]-[month]-[day]");
    if format.is_err() {
        eprintln!("Somehow format is in invalid format!");
        return;
    }
    let date_format = format.unwrap();
    let today = time::OffsetDateTime::now_utc();
    let today_format = today.format(&date_format);
    if today_format.is_err() {
        eprintln!("Failed to format todays date");
        return;
    }

    let cache = dirs::cache_dir().unwrap_or(PathBuf::new());
    let path = cache.join("drag_blog_last_post");

    // println!("{:?}", path);
    // println!("{:?}", fs::read_to_string(&path));

    let stored_last = fs::read_to_string(&path).unwrap_or(today_format.unwrap());
    let last_res = time::Date::parse(&stored_last.trim(), &date_format);
    let last = if last_res.is_err() {
        println!("Failed to convert stored into date, using today");
        time::OffsetDateTime::now_utc().date()
    } else {
        last_res.unwrap()
    };

    let blog = json_result
        .iter()
        .filter(|v| !v.categories.contains(&"hidden".to_string()))
        .filter(|v| {
            let blog_date = time::Date::parse(&v.date, &date_format);
            if blog_date.is_err() {
                eprintln!(
                    "Failed to convert blog date into date element! {}",
                    blog_date.err().unwrap()
                );
                return false;
            }

            // println!(
            //     "{:?}, {:?}",
            //     blog_date,
            //     time::OffsetDateTime::now_utc().date()
            // );
            blog_date.unwrap() > last
        });
    // .map(|v| v.clone());
    // .collect::<Vec<BlogFeedEntry>>();

    let newest_post = blog.clone().map(|v| v.date.clone()).last();
    if newest_post.is_none() {
        println!("No posts in list, hence no point in posting.");
        return;
    }

    let data = toml::from_file(".mastodon.toml");
    if data.is_err() {
        eprintln!("Failed to load user data");
    }
    let user = data.unwrap();

    let posts = blog
        .map(|v| {
            mastodon_async::StatusBuilder::new()
                .status(format!(
                    "New blog: {}\n\n{}\n\nLink: https://dragmine149.github.io/Blog?blog={}",
                    v.date, v.preview, v.date
                ))
                .build()
        })
        .filter(|v| {
            if v.is_err() {
                eprintln!("Failed to make post: {}", v.as_ref().err().unwrap());
            }
            v.is_ok()
        })
        .map(|v| v.unwrap());

    let client = mastodon_async::Mastodon::from(user);
    for v in posts {
        println!("{:?}", v);
        let result = client.new_status(v.clone()).await;
        if result.is_err() {
            eprintln!("Failed to post {:?} due to {}", v, result.err().unwrap());
        }
    }

    let store = fs::write(path, newest_post.unwrap());
    if store.is_err() {
        eprintln!(
            "Failed to store last blog post in file {}",
            store.err().unwrap()
        );
        return;
    }
}
