okay.. here is a new thing i want you to do okay?
this is a more complex feature that requires deep understanding into modification to excel.

so basically here is what should happen okay?

there's a master's list that the user uploads, that is where the data of injection comes from..

then there is another thing which is the profile.
now, here is what i need you to do okay?

1. the user uploads the masters list
2. the system reads it once and then keep it as a memory
3. there is a template.xlsx in the public folder.. that is the template of the farmers profile.
4. after the system reads the masters list, the system will now produce an xlsx file that is based on the template with populated data from the masters lists.

the cell coordinates are identical in the injecting on the google spreadsheet. so yeah, can we do that?

here is the structure attached image.
the column you need to put is this:
"C" which is the lot number of the user.

"D" Crop season
"E" Crop Year
"H" Planted Area

"M" Land Owner's Last Name
"N" Land Owner's First Name

"O" Farmer's / Land Tiller's Last name
"P" Farmer's / Land Tiller's Last name

"Q" Old account

so yeah, that's the master's lists data that you need to get okay?

now let us move to the template..

you will put the

"C" column from the masters list to C:3 in template
"M" column from the masters list to C:9 in template
"N" column from the masters list to C:7 in temlpate
"O" column from the masters list to C:13 in template

for the old balance, this is kind of tricky since this is actually going to the new page of the template which is the page: "01 SOA 01"..
"P" column from the masters list to G:101 in the template on page "01 SOA 01"..

This is a complicated process.. as you can see in the master's list, it has like a 4 rows with the same lot number.. meaning they have 4 counts of rows.. as you can notice, the land owner and the land tiller's identity does not change. it is constant.. so what i need you to do is to focus only on these as they are not getting repeated over and over:
"D" --> B30 and so on
"E" --> C30 and so on
"H" --> D30 and so on

as you noticed there is a keyword for "so on.." meaning the system will write a row according to how many is the row of their existing lot number in the masters list records..

after creating, it should go and create a file in this format:

{queue number e.g., "01, 02, 03"} {Lot number e.g., "1920-C"} {Last Name, First Name of the owner}

it should look like this:

01 3170-1 Mendoza, Dominga VDA
02 3170-2 Bustamante, Encarnacion
03 3170-3 Fernando, Enrique
04 3170-4 Perez, Ben
05 3172-A5 Tonia, Leodina
06 3172-B Enrile, Paz
07 3173-A5 Jacinto, Josefina

see the pattern on queue numbers?
the queue number is based on how the masters file is read, from the top, meaning what the first lot is generated must be number 1 on the list, e.g.,

the lot 1062 from row 2 has 8 rows. it should be the 01 cause it's placed on the top, after the 8 rows of 1062, must be the second lot with 20 rows.. which after will become 02 as their queue in the filename.
