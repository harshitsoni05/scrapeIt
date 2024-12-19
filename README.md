# ScrapeIt
To run the end to end complete website, you need to run following 5 applications simultaneously -

* MongoDB - Install mongo db on your system. You can follow any online guide to install it.

* Next JS frontend- To run the next.js app follow the instructions - 
1. Go the fe/tree-view-app on terminal/cmd and run 'npm install'
2. Run 'npm run dev'

* Python Flask backend - To run the flask app, follow the instructions - 
1. Install all the dependencies in backend/requirement.txt. 
2. Run 'python main.py' on a separate cmd/terminal.
3. If you get any error, it would be because of missing dependency. Install the missing dependencies if any.

* RabbitMQ broker - To run the RabbiMQ broker, you can download and install rabbitmq on your system or on docker.
Run rabbitmq server or container with port 5672 for the broker.

* Python scraper microservice - To run the scraper service, run the 'python consumer.py' on a separate terminal
and install missing dependencies if missing.

After running all these applications parallely, you can browse to locahost:3000. Signup with an account and login.
- You can scrape any wesbite. It will 2-5 minutes for the website to get loaded and scraped. It will be visible on documents/ page.
- Once it is visible, you can click and move to the editor and file structure and select and edit individual files.
- You can invite any user to view and edit the same document simultaneously as a live document.