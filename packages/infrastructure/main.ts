import { Construct } from 'constructs';
import { App, Chart, ChartProps, Size } from 'cdk8s';
import { Cpu, Deployment, Namespace, Node, NodeLabelQuery } from 'cdk8s-plus-27';

export class MyChart extends Chart {
  constructor(scope: Construct, id: string, props: ChartProps = { 
    namespace: "node-api"
  }) {
    super(scope, id, props);

    new Namespace(this, 'namespace', {
      metadata: {name:"node-api"}
    });

    const deployment = new Deployment(this, 'deployment', {
      replicas: 1,
      securityContext: {
        ensureNonRoot: false,
      },
      
      containers: [
        {
          securityContext: {
            ensureNonRoot: false,
          },
          image: "gkaskonas/node-api:v1",
          ports: [
            {
              number: 8080,
              name: 'http'
            }
          ],
          resources: {
            cpu: {
              request: Cpu.millis(100)
            },
            memory: {
              request: Size.mebibytes(100)
            }
          }
        }
      ]
  });

  deployment.exposeViaService({});

  deployment.scheduling.attract(Node.labeled(NodeLabelQuery.is("nodetype", "worker")))
}
}

const app = new App();
new MyChart(app, 'infrastructure');
app.synth();
