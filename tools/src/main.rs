mod blog;
mod websiteignore;

use std::env;

fn main() {
    let args = env::args().collect::<Vec<String>>();

    if args.len() < 2 {
        help();
        return;
    }

    match args[1].as_str() {
        "help" => help(),
        "json" => {
            let blogs = blog::make_blog_list();
            blog::make_json(&blogs);
        }
        "rss" => {
            let blogs = blog::make_blog_list();
            blog::make_rss_feed(&blogs);
        }
        "website" => {
            websiteignore::main();
        }
        _ => {
            help();
        }
    }
}

fn help() {
    println!("Usage: tools [command]");
    println!("Commands:");
    println!("  help - display this help message");
    println!("  json - generate Blog JSON file");
    println!("  rss - generate Blog RSS feed");
    println!("  website - generate website .includes.txt file");
}
