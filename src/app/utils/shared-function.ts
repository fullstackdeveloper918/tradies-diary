export function filterByName(moduleName: string,event:any,afs:any, accountFirebase:any, passID:any){
     let query;
    // Check if the name filter exists and apply it to the query
    if (event.target.value.length > 0) {
        query = afs.collection('/accounts').doc(accountFirebase)
            .collection('/variations', ref => ref
                .where("projectId", '==', passID.id)
                .where("variationsName", "==", event.target.value)
                // .where("variationsName", "==", event.target.value + '\uf8ff') // For case-insensitive search
                // .orderBy("variationsName") // First order by "name" since we're filtering it with an inequality
                // .orderBy("variantsNumber", 'desc') // Then order by "variantsNumber" for descending order
                .limit(10)
            );`                   `
    } else {
      // If no name filter is applied, fallback to a default query
      query = afs.collection('/accounts').doc(accountFirebase)
          .collection('/variations', ref => ref
              .where("projectId", '==', passID.id)
              .orderBy("variantsNumber", 'desc')  // For ordering variations by number or any other criteria
              .limit(10)
          );
  }
  return query;
}
