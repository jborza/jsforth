import subprocess

filename = 'testcases'


with open(filename,'r') as f:
    lines = f.readlines()
    for line in [line.strip() for line in lines]:
        if(line.startswith('#')):
            continue
        if(len(line) == 0):
            continue
        print()
        print('~Test case~')
        print(line)
        input,expected = line.split('<-')
        expected = expected.strip()
        print(f'code:  {input}')
        print(f'expected: {expected}')

        #quote quotes
        input = input.replace('"', '\\"')

        cmd = f'echo "{input}" | node index.js /noprompt'
        result = subprocess.getoutput(cmd).strip()
        print(f'actual: {result}')
        if(expected != result):
            print('error!')
            exit(1)
