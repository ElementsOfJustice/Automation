import textgrid

def main():
   tg = textgrid.TextGrid.fromFile('C:/Users/rct3f/AppData/Local/Adobe/Animate 2022/en_US/Configuration/Commands/VoiceLineProcessor/s5_151_fair_devotion.TextGrid')
   print(tg[1][1])
main()
    