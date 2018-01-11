import sys
import sklearn
import csv
def size_mb(docs):
    return sum(len(s.encode('utf-8')) for s in docs) / 1e6

class SoupDefinition:
    def __init__(self, soup, is_soup):
        self.soup = soup
        self.is_soup = is_soup.upper() == 'TRUE'
    def __str__(self):
        return '{\n  soup: %s,\n  is_soup: %s\n}' % (self.soup, self.is_soup)

print(sys.argv)
if (len(sys.argv) != 2):
    print('This script requires a single arguement that is the training file csv')
    sys.exit(1)

training_data_file = sys.argv[1]


data = []
with open(training_data_file) as csvfile:
    reader = csv.reader(csvfile, delimiter=',')
    headers = []
    for index, row in enumerate(reader):
        if index == 0:
            continue # skip headers
        else:
            obj = SoupDefinition(row[0], row[1])
            data.append(obj)
