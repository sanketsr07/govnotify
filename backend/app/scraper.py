import httpx
from bs4 import BeautifulSoup

def scrape_ksp():
    """Scrape Karnataka Police notifications"""
    notifications = []
    try:
        url = "https://www.ksp.karnataka.gov.in/page/Recruitment/Current+Recruitment/en"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = httpx.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")

        links = soup.find_all("a")
        for link in links:
            text = link.get_text(strip=True)
            href = link.get("href", "")
            if text and len(text) > 10:
                notifications.append({
                    "title": text,
                    "category": "Police",
                    "source": "Karnataka Police",
                    "link": href if href.startswith("http") else "https://www.ksp.karnataka.gov.in" + href,
                    "last_date": "Check official site"
                })
    except Exception as e:
        print(f"KSP scrape error: {e}")
    
    return notifications


def scrape_joinindianarmy():
    """Scrape Indian Army notifications"""
    notifications = []
    try:
        url = "https://joinindianarmy.nic.in/NotificationList.aspx"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = httpx.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")

        links = soup.find_all("a")
        for link in links:
            text = link.get_text(strip=True)
            href = link.get("href", "")
            if text and len(text) > 10:
                notifications.append({
                    "title": text,
                    "category": "Army",
                    "source": "Indian Army",
                    "link": href if href.startswith("http") else "https://joinindianarmy.nic.in/" + href,
                    "last_date": "Check official site"
                })
    except Exception as e:
        print(f"Army scrape error: {e}")

    return notifications


def run_all_scrapers():
    all_notifications = []
    all_notifications.extend(scrape_ksp())
    all_notifications.extend(scrape_joinindianarmy())
    return all_notifications